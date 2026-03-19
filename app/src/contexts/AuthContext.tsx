import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  apiClient,
  LoginPayload,
  RegisterPayload,
  UserSummary,
} from "../services/api";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type RefreshSessionOptions = { abortPrevious?: boolean };

interface AuthContextValue {
  user: UserSummary | null;
  token: string | null;
  status: AuthStatus;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: (options?: RefreshSessionOptions) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type ValidationOptions = {
  force?: boolean;
  abortPrevious?: boolean;
};

let sharedValidationPromise: Promise<void> | null = null;
let sharedValidationController: AbortController | null = null;
let validationSequence = 0;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserSummary | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const clearSession = useCallback(async () => {
    sharedValidationController?.abort();
    sharedValidationPromise = null;
    validationSequence += 1;
    sharedValidationController = null;

    await apiClient.clearToken();
    setToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const redirectToLogin = useCallback(() => {
    navigate("/login", { replace: true });
  }, [navigate]);

  const handleInvalidToken = useCallback(async () => {
    await clearSession();
    redirectToLogin();
  }, [clearSession, redirectToLogin]);

  const authenticate = useCallback(
    async (payload: LoginPayload | RegisterPayload, action: "login" | "register") => {
      const result =
        action === "login"
          ? await apiClient.login(payload as LoginPayload)
          : await apiClient.register(payload as RegisterPayload);

      await apiClient.persistToken(result.token);
      setToken(result.token);
      setUser(result.user);
      setStatus("authenticated");
      navigate("/collections", { replace: true });
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
      const currentSequence = validationSequence;

      setStatus("loading");

      const promise = (async () => {
        const stored = await apiClient.getPersistedToken();
        if (!stored) {
          if (currentSequence === validationSequence) {
            setToken(null);
            setUser(null);
            setStatus("unauthenticated");
          }
          return;
        }

        if (currentSequence !== validationSequence) {
          return;
        }

        setToken(stored);

        try {
          const response = await apiClient.validateToken({ signal: controller.signal });
          if (currentSequence !== validationSequence) {
            return;
          }

          setUser(response.user);
          setStatus("authenticated");
        } catch (error) {
          if (controller.signal.aborted || currentSequence !== validationSequence) {
            return;
          }

          if ((error as Error & { status?: number }).status === 401) {
            await handleInvalidToken();
          } else {
            setStatus("unauthenticated");
          }
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
    runValidation();
  }, [runValidation]);

  const refreshSession = useCallback(
    (options?: RefreshSessionOptions) =>
      runValidation({ force: true, abortPrevious: options?.abortPrevious ?? true }),
    [runValidation],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, status, login, register, logout, refreshSession }),
    [login, logout, register, refreshSession, status, token, user],
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
