import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { apiClient, Workspace } from "../services/api";
import { loadGuestWorkspace } from "../services/guestStorage";
import { useAuth } from "./AuthContext";

interface WorkspaceContextValue {
  workspaces: Workspace[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export const WorkspacesProvider = ({ children }: { children: React.ReactNode }) => {
  const { status, isAuthenticated, isGuest } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  const loadRemoteWorkspaces = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const payload = await apiClient.fetchWorkspaces({ signal: controller.signal });
      if (requestIdRef.current !== currentRequestId) {
        return;
      }

      setWorkspaces(payload);
    } catch (err) {
      if (controller.signal.aborted) {
        return;
      }

      const message = err instanceof Error ? err.message : "Unable to load workspaces";
      setError(message);
    } finally {
      if (requestIdRef.current === currentRequestId) {
        setLoading(false);
      }
    }
  }, [isAuthenticated]);

  const loadLocalWorkspaces = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const workspace = await loadGuestWorkspace();
      setWorkspaces([workspace]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load guest workspace";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWorkspaces = useCallback(async () => {
    controllerRef.current?.abort();

    if (isGuest) {
      await loadLocalWorkspaces();
      return;
    }

    if (isAuthenticated) {
      await loadRemoteWorkspaces();
      return;
    }

    setWorkspaces([]);
    setError(null);
    setLoading(false);
  }, [isGuest, isAuthenticated, loadLocalWorkspaces, loadRemoteWorkspaces]);

  const refresh = useCallback(() => loadWorkspaces(), [loadWorkspaces]);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    void loadWorkspaces();
  }, [status, loadWorkspaces]);

  useEffect(() => {
    if (status === "unauthenticated" && !isGuest && !isAuthenticated) {
      setWorkspaces([]);
      setError(null);
      setLoading(false);
    }
  }, [status, isGuest, isAuthenticated]);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const value = useMemo(
    () => ({ workspaces, loading, error, refresh }),
    [workspaces, loading, error, refresh],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export const useWorkspaces = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspaces must be used within WorkspacesProvider");
  }
  return context;
};
