import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  apiClient,
  LoginPayload,
  RegisterPayload,
  UserSummary,
  setUnauthorizedHandler,
} from "../services/api";
import { getGuestMode, setGuestMode } from "../services/guestSession";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type RefreshSessionOptions = { abortPrevious?: boolean };

interface AuthContextValue {
  user: UserSummary | null;
  token: string | null;
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  isUnauthenticated: boolean;
  isGuest: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: (options?: RefreshSessionOptions) => Promise<void>;
  continueAsGuest: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type ValidationOptions = {
  force?: boolean;
  abortPrevious?: boolean;
};

let sharedValidationPromise: Promise<void> | null = null;
let sharedValidationController: AbortController | null = null;
let validationSequence = 0;
let initialValidationRequested = false;
let lastSuccessfulValidationAt = 0;
let lastHandledValidationSequence = 0;

export const resetInitialValidationRequest = () => {
  initialValidationRequested = false;
};

export const resetAuthValidationState = () => {
  sharedValidationPromise = null;
  sharedValidationController = null;
  validationSequence = 0;
  initialValidationRequested = false;
  lastSuccessfulValidationAt = 0;
  lastHandledValidationSequence = 0;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserSummary | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [isGuest, setIsGuest] = useState<boolean>(() => getGuestMode());

  const clearSession = useCallback(async () => {
    sharedValidationController?.abort();
    sharedValidationPromise = null;
    validationSequence += 1;
    sharedValidationController = null;
    lastSuccessfulValidationAt = 0;
    lastHandledValidationSequence = 0;

    await apiClient.clearToken();
    setToken(null);
    setUser(null);
    setStatus("unauthenticated");
    setIsGuest(false);
    setGuestMode(false);
  }, []);

  const redirectToLogin = useCallback(() => {
    navigate("/login", { replace: true });
  }, [navigate]);

  const handleInvalidToken = useCallback(async () => {
    await clearSession();
    setIsGuest(false);
    setGuestMode(false);
    redirectToLogin();
  }, [clearSession, redirectToLogin]);

  const authenticate = useCallback(
    async (payload: LoginPayload | RegisterPayload, action: "login" | "register") => {
      setGuestMode(false);
      setIsGuest(false);
      const result =
        action === "login"
          ? await apiClient.login(payload as LoginPayload)
          : await apiClient.register(payload as RegisterPayload);

      await apiClient.persistToken(result.token);
      setToken(result.token);
      setUser(result.user);
      setStatus("authenticated");
      navigate("/collections", { replace: true });
      window.dispatchEvent(new Event("pixend:refresh-workspaces"));
    },
    [navigate],
  );

  const login = useCallback(
    (payload: LoginPayload) => authenticate(payload, "login"),
    [authenticate],
  );

  const register = useCallback(
    (payload: RegisterPayload) => authenticate(payload, "register"),
    [authenticate],
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch {
      // best effort
    } finally {
      await handleInvalidToken();
    }
  }, [handleInvalidToken]);

  const continueAsGuest = useCallback(async () => {
    await clearSession();
    setIsGuest(true);
    setGuestMode(true);
    navigate("/collections", { replace: true });
  }, [clearSession, navigate]);

  const runValidation = useCallback(
    async ({ force = false, abortPrevious = true }: ValidationOptions = {}) => {
      if (sharedValidationPromise && !force) {
        return sharedValidationPromise;
      }

      if (abortPrevious) {
        sharedValidationController?.abort();
      }

      const controller = new AbortController();
      sharedValidationController = controller;
      validationSequence += 1;
      const requestSequence = validationSequence;
      const requestStartAt = Date.now();

      setStatus("loading");

      const promise = (async () => {
        const stored = await apiClient.getPersistedToken();
        if (!stored) {
          if (requestSequence >= lastHandledValidationSequence) {
            lastHandledValidationSequence = requestSequence;
            setToken(null);
            setUser(null);
            setStatus("unauthenticated");
          }
          return;
        }

        if (requestSequence < lastHandledValidationSequence) {
          return;
        }

        setToken(stored);

        try {
          const response = await apiClient.validateToken({ signal: controller.signal });
          if (requestSequence < lastHandledValidationSequence) {
            return;
          }

          setUser(response.user);
          setStatus("authenticated");
          lastSuccessfulValidationAt = Date.now();
          lastHandledValidationSequence = Math.max(lastHandledValidationSequence, requestSequence);
        } catch (error) {
          if (controller.signal.aborted) {
            return;
          }

          if (requestSequence < lastHandledValidationSequence) {
            return;
          }

          if ((error as Error & { status?: number }).status === 401) {
            if (lastSuccessfulValidationAt >= requestStartAt) {
              lastHandledValidationSequence = Math.max(lastHandledValidationSequence, requestSequence);
              return;
            }
            await handleInvalidToken();
          } else {
            setStatus("unauthenticated");
          }
          lastHandledValidationSequence = Math.max(lastHandledValidationSequence, requestSequence);
        }
      })();

      sharedValidationPromise = promise;

      try {
        await promise;
      } finally {
        if (sharedValidationPromise === promise) {
          sharedValidationPromise = null;
          sharedValidationController = null;
        }
      }
    },
    [handleInvalidToken],
  );

  useEffect(() => {
    if (initialValidationRequested) {
      return;
    }

    initialValidationRequested = true;
    runValidation();
  }, [runValidation]);

  const refreshSession = useCallback(
    (options?: RefreshSessionOptions) =>
      runValidation({ force: true, abortPrevious: options?.abortPrevious ?? true }),
    [runValidation],
  );

  useEffect(() => {
    setUnauthorizedHandler(handleInvalidToken);
    return () => {
      setUnauthorizedHandler(null);
    };
  }, [handleInvalidToken]);

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const isUnauthenticated = status === "unauthenticated";

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      status,
      isLoading,
      isAuthenticated,
      isUnauthenticated,
      isGuest,
      login,
      register,
      logout,
      refreshSession,
      continueAsGuest,
    }),
    [
      login,
      logout,
      register,
      refreshSession,
      status,
      token,
      user,
      isLoading,
      isAuthenticated,
      isUnauthenticated,
      isGuest,
      continueAsGuest,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
