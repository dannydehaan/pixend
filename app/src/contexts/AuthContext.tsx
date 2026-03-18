import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  apiClient,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  UserSummary,
} from "../services/api";

type AuthStatus = "idle" | "validating" | "authenticated" | "offline";

interface AuthContextValue {
  user: UserSummary | null;
  token: string | null;
  status: AuthStatus;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserSummary | null>(null);
  const [status, setStatus] = useState<AuthStatus>("idle");

  const clearSession = useCallback(async () => {
    await apiClient.clearToken();
    setToken(null);
    setUser(null);
    setStatus("idle");
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

  const validateStoredToken = useCallback(async () => {
    const stored = await apiClient.getPersistedToken();
    if (!stored) {
      setStatus("idle");
      return;
    }
    setToken(stored);
    setStatus("validating");

    try {
      const response = await apiClient.validateToken();
      setUser(response.user);
      setStatus("authenticated");
    } catch (error) {
      if ((error as Error & { status?: number }).status === 401) {
        await handleInvalidToken();
      } else {
        setStatus("offline");
      }
    }
  }, [handleInvalidToken]);

  useEffect(() => {
    validateStoredToken();
  }, [validateStoredToken]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, status, login, register, logout }),
    [login, logout, register, status, token, user],
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
