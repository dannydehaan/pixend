import { useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useWorkspaces } from "../../contexts/WorkspaceContext";
import { Collection } from "../../services/api";
import { CreateCollectionModal } from "./CreateCollectionModal";
import { CreateEnvironmentModal } from "./CreateEnvironmentModal";

const navLinks = [
  { icon: "folder_open", label: "Collections", active: true },
  { icon: "api", label: "APIs" },
  { icon: "cloud_queue", label: "Environments" },
  { icon: "dns", label: "Mock Servers" },
];

const formatRelativeUpdated = (timestamp?: string) => {
  if (!timestamp) return "Updated soon";
  const diffHours = Math.max(0, Math.round((Date.now() - new Date(timestamp).getTime()) / 1000 / 60 / 60));
  return diffHours <= 1 ? "Updated moments ago" : `Updated ${diffHours}h ago`;
};

export const CollectionsScreen = () => {
  const { status } = useAuth();
  const { workspaces, loading, error, refresh } = useWorkspaces();
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [activeCollection, setActiveCollection] = useState<Collection | null>(null);

  const collections = useMemo(() => workspaces.flatMap((workspace) => workspace.collections ?? []), [workspaces]);
  const totalEnvironments = useMemo(
    () => collections.reduce((acc, collection) => acc + (collection.environments?.length ?? 0), 0),
    [collections],
  );
  const heroCollection = collections[0];
  const totalEndpoints = heroCollection?.endpoint_count ?? 0;

  const connectionState = useMemo(() => {
    if (status === "loading") return "Connecting...";
    if (status === "authenticated") {
      return `Connected · ${collections.length} collections · ${totalEnvironments} environments`;
    }
    return "Not authenticated";
  }, [collections.length, status, totalEnvironments]);

  return (
    <div className="flex h-screen overflow-hidden bg-surface text-on-surface">
      <aside className="hidden md:flex flex-col h-full border-r border-[#494454]/10 bg-[#131b2e] w-64 flex-shrink-0">
        <div className="p-6 flex flex-col gap-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary-container text-sm">architecture</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-bold text-sm text-on-surface tracking-tight">Pixend</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#dae2fd]/50">Engineering</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCreatingCollection(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded bg-surface-container-high text-primary text-xs font-semibold uppercase tracking-widest hover:bg-[#222a3d]/50 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Collection
          </button>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navLinks.map((link) => (
            <div
              key={link.label}
              className={`flex items-center gap-3 px-3 py-3 rounded transition-all cursor-pointer ${
                link.active
                  ? "bg-[#222a3d] text-[#d0bcff] border-r-2 border-[#d0bcff]"
                  : "text-[#dae2fd]/50 hover:text-[#dae2fd] hover:bg-[#222a3d]/50"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
              <span className="text-xs font-semibold uppercase tracking-widest">{link.label}</span>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-[#494454]/10 flex flex-col gap-1">
          <div className="flex items-center gap-3 px-3 py-3 rounded text-[#dae2fd]/50 hover:text-[#dae2fd] hover:bg-[#222a3d]/50 transition-all cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span className="text-xs font-semibold uppercase tracking-widest">Settings</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-3 rounded text-[#dae2fd]/50 hover:text-[#dae2fd] hover:bg-[#222a3d]/50 transition-all cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">help</span>
            <span className="text-xs font-semibold uppercase tracking-widest">Help</span>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col h-full bg-surface overflow-y-auto">
        <header className="sticky top-0 z-50 flex justify-between items-center w-full px-6 h-16 backdrop-blur-xl bg-[#0b1326]/90 border-none">
          <div className="flex items-center gap-8">
            <span className="text-xl font-black tracking-tighter uppercase text-[#d0bcff]">Pixend</span>
            <nav className="hidden lg:flex items-center gap-6">
              <a className="font-['Inter'] tracking-tight text-sm font-bold text-[#d0bcff] border-b-2 border-[#d0bcff] pb-1" href="#">
                Workspace
              </a>
              <a className="font-['Inter'] tracking-tight text-sm font-medium text-[#dae2fd]/60 hover:text-[#dae2fd]" href="#">
                Environments
              </a>
              <a className="font-['Inter'] tracking-tight text-sm font-medium text-[#dae2fd]/60 hover:text-[#dae2fd]" href="#">
                History
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button className="p-2 rounded hover:bg-[#222a3d] transition-colors duration-200 text-[#dae2fd]/60">
                <span className="material-symbols-outlined">settings</span>
              </button>
              <button className="p-2 rounded hover:bg-[#222a3d] transition-colors duration-200 text-[#dae2fd]/60">
                <span className="material-symbols-outlined">notifications</span>
              </button>
            </div>
            <button className="bg-primary-container text-on-primary-container px-5 py-1.5 rounded-lg text-sm font-bold active:scale-95 transition-all">
              Send
            </button>
          </div>
        </header>
        <section className="hero-gradient px-8 pt-12 pb-16">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-4 max-w-2xl">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-widest uppercase">Collection</span>
                  <span className="text-outline-variant text-xs">•</span>
                  <span className="text-on-surface-variant text-xs font-mono">Project dashboard</span>
                </div>
                <h1 className="text-5xl font-headline font-black tracking-tighter text-on-surface">
                  {heroCollection?.name ?? "Project Workspace"}
                </h1>
                <p className="text-on-surface-variant text-lg leading-relaxed font-light">
                  {heroCollection?.description ||
                    "Structure your collections, add environments, and keep every endpoint synchronized in one secure workspace."}
                </p>
                <div className="flex items-center gap-6 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">description</span>
                    <span className="text-sm text-on-surface/80">{totalEndpoints} Endpoints</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">update</span>
                    <span className="text-sm text-on-surface/80">{formatRelativeUpdated(heroCollection?.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">public</span>
                    <span className="text-sm text-on-surface/80">
                      {heroCollection?.access_level === "public" ? "Public" : "Private"} Access
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingCollection(true)}
                  className="cta-gradient text-on-primary px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-2xl shadow-primary/10 hover:brightness-110 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined">playlist_add</span>
                  New Collection
                </button>
                <button className="px-8 py-3 rounded-xl border border-outline-variant/30 text-on-surface font-semibold flex items-center justify-center gap-2 hover:bg-surface-container-high transition-all">
                  <span className="material-symbols-outlined text-lg">share</span>
                  Export Docs
                </button>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-[0.4em]">
              <span className={`w-2 h-2 rounded-full ${status === "authenticated" ? "bg-emerald-400" : "bg-amber-400"}`} />
              <span className="text-on-surface-variant">{connectionState}</span>
            </div>
          </div>
        </section>
        <section className="px-8 py-10 max-w-6xl mx-auto w-full space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-secondary/70">Collections</p>
              <h2 className="text-2xl font-bold">Workspace overview</h2>
            </div>
            <div>
              <button
                type="button"
                onClick={() => setIsCreatingCollection(true)}
                className="px-4 py-2 rounded-md bg-primary/20 text-primary text-xs font-semibold uppercase tracking-[0.3em]"
              >
                + Collection
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-error/80">{error}</p>}
          {loading && <p className="text-sm text-on-surface-variant">Loading workspaces…</p>}
          <div className="grid gap-4 lg:grid-cols-2">
            {collections.map((collection) => (
              <article key={collection.id} className="rounded-2xl border border-[#494454]/40 bg-[#11152a] p-6 space-y-4 shadow-lg shadow-black/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-[#dae2fd]/60">{collection.access_level}</p>
                    <h3 className="text-xl font-semibold">{collection.name}</h3>
                  </div>
                  <span className="text-sm text-on-surface-variant">{collection.status}</span>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">{collection.description || "No description yet."}</p>
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-[#dae2fd]/60">
                  <span>{collection.endpoint_count} endpoints</span>
                  <span>{collection.environments?.length ?? 0} environments</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(collection.environments ?? []).map((environment) => (
                    <span
                      key={environment.id}
                      className="px-2 py-1 rounded-full border border-[#494454]/40 text-[11px] text-[#dae2fd]/70"
                    >
                      {environment.name}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant">{formatRelativeUpdated(collection.created_at)}</span>
                  <button
                    type="button"
                    onClick={() => setActiveCollection(collection)}
                    className="px-3 py-1 rounded-full border border-outline-variant/40 text-xs uppercase tracking-[0.4em]"
                  >
                    New Environment
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!collections.length && !loading && (
            <p className="rounded-2xl border border-dashed border-[#494454]/50 px-6 py-5 text-sm text-on-surface-variant">
              No collections yet. Create one to get started.
            </p>
          )}
        </section>
      </main>
      <CreateCollectionModal
        open={isCreatingCollection}
        onClose={() => setIsCreatingCollection(false)}
        onSuccess={() => {
          setIsCreatingCollection(false);
          refresh();
        }}
      />
      <CreateEnvironmentModal
        collection={activeCollection}
        open={Boolean(activeCollection)}
        onClose={() => setActiveCollection(null)}
        onSuccess={() => {
          setActiveCollection(null);
          refresh();
        }}
      />
    </div>
  );
};
