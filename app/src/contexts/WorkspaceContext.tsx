import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Workspace } from "../services/api";
import { workspaceService } from "../services/workspaceService";
import { useAuth } from "./AuthContext";

interface WorkspaceContextValue {
  workspaces: Workspace[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addCollectionToWorkspace: (workspaceId: number, collection: NonNullable<Workspace["collections"]>[number]) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export const WorkspacesProvider = ({ children }: { children: React.ReactNode }) => {
  const { status, isAuthenticated, isGuest } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  const loadWorkspaces = useCallback(async () => {
    controllerRef.current?.abort();

    if (!isGuest && !isAuthenticated) {
      setWorkspaces([]);
      setError(null);
      setLoading(false);
      return;
    }

    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const payload = await workspaceService.getWorkspaces({ signal: controller.signal });
      if (requestIdRef.current !== currentRequestId) {
        return;
      }

      setWorkspaces(payload);
    } catch (err) {
      if (controller.signal.aborted) {
        return;
      }

      if (requestIdRef.current !== currentRequestId) {
        return;
      }

      const message = err instanceof Error ? err.message : "Unable to load workspaces";
      setError(message);
    } finally {
      if (controllerRef.current === controller && requestIdRef.current === currentRequestId) {
        setLoading(false);
      }
    }
  }, [isGuest, isAuthenticated]);

  const refresh = useCallback(() => loadWorkspaces(), [loadWorkspaces]);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    void loadWorkspaces();
  }, [status, loadWorkspaces]);

  useEffect(() => {
    const handler = () => {
      void loadWorkspaces();
    };

    window.addEventListener("pixend:refresh-workspaces", handler);
    return () => window.removeEventListener("pixend:refresh-workspaces", handler);
  }, [loadWorkspaces]);

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

  const addCollectionToWorkspace = useCallback(
    (workspaceId: number, collection: NonNullable<Workspace["collections"]>[number]) => {
      setWorkspaces((prev) =>
        prev.map((workspace) => {
          if (workspace.id !== workspaceId) {
            return workspace;
          }

          const existingCollections = workspace.collections ?? [];
          return {
            ...workspace,
            collections: [...existingCollections, collection],
          };
        }),
      );
    },
    [],
  );

  const value = useMemo(
    () => ({ workspaces, loading, error, refresh, addCollectionToWorkspace }),
    [workspaces, loading, error, refresh, addCollectionToWorkspace],
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
