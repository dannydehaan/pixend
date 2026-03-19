import { useMemo } from "react";
import { Workspace } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useWorkspaces } from "../../contexts/WorkspaceContext";

const WorkspaceCard = ({ workspace }: { workspace: Workspace }) => (
  <article className="bg-surface-container-lowest border border-[#494454] rounded-2xl p-5 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-on-surface">{workspace.name}</h3>
        <p className="text-xs text-on-surface-variant">{workspace.slug}</p>
      </div>
      <span className="text-[10px] uppercase tracking-[0.3em] text-primary">Workspace</span>
    </div>
    <p className="text-sm text-on-surface-variant">{workspace.description || "No description"}</p>
    <div className="flex flex-wrap gap-2">
      {workspace.users?.map((user) => (
        <span key={user.id} className="text-xs px-3 py-1 rounded-full bg-surface-container-highest">
          {user.name}
        </span>
      ))}
    </div>
  </article>
);

export const CollectionsScreen = () => {
  const { status, logout } = useAuth();
  const { workspaces, loading, error, refresh } = useWorkspaces();

  const badgeText = useMemo(() => {
    if (status === "authenticated") {
      if (workspaces.length) {
        return `Connected · ${workspaces.length} workspace${workspaces.length === 1 ? "" : "s"}`;
      }
      return "Connected · no workspaces yet";
    }

    if (status === "unauthenticated") {
      return "Not authenticated";
    }

    return "Connecting...";
  }, [status, workspaces.length]);

  return (
    <div className="min-h-screen bg-background text-on-background font-body px-4 py-10">
      <div className="w-full max-w-5xl mx-auto grid gap-8 lg:grid-cols-2">
        <div className="space-y-5">
          <p className="text-xs uppercase tracking-[0.4em] text-on-surface-variant">Pixend API</p>
          <h1 className="text-4xl font-headline font-bold">Manage workspaces with Pixend</h1>
          <p className="text-sm text-on-surface-variant">
            Authenticate with Laravel and keep your workspace inventory in sync. Tokens are stored securely and validated on startup.
          </p>
          <div className="flex items-center gap-3 rounded-full px-4 py-2 bg-surface-container-highest text-xs uppercase tracking-[0.4em] text-on-surface">
            <span className={`w-2 h-2 rounded-full ${status === "authenticated" ? "bg-emerald-400" : "bg-amber-400"}`} />
            {badgeText}
          </div>
          {error && <p className="text-sm text-error/80">{error}</p>}
          <button onClick={logout} className="text-sm text-primary/80 hover:text-primary transition-colors">
            Disconnect
          </button>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-on-surface">Workspaces</h2>
            <button
              type="button"
              onClick={refresh}
              className="text-xs uppercase tracking-[0.4em] text-on-surface-variant hover:text-on-surface transition-colors"
              disabled={loading}
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
          <div className="space-y-4">
            {workspaces.map((workspace) => (
              <WorkspaceCard key={workspace.id} workspace={workspace} />
            ))}
            {!workspaces.length && (
              <p className="text-sm text-on-surface-variant">
                {status === "authenticated" ? "No workspaces yet." : "Waiting for a connection..."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
