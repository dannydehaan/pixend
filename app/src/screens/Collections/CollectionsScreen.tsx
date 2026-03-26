import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useWorkspaces } from "../../contexts/WorkspaceContext";
import { Collection } from "../../services/api";
import { CreateCollectionModal } from "./CreateCollectionModal";
import { CreateEnvironmentModal } from "./CreateEnvironmentModal";
import {
  PixCollection,
  exportCollection,
  parseCollectionFile,
} from "../../lib/collectionIO";

const formatRelativeUpdated = (timestamp?: string) => {
  if (!timestamp) return "Updated soon";
  const diffHours = Math.max(0, Math.round((Date.now() - new Date(timestamp).getTime()) / 1000 / 60 / 60));
  return diffHours <= 1 ? "Updated moments ago" : `Updated ${diffHours}h ago`;
};

const canCreateCollection = (isGuest: boolean, collectionsLength: number) => !isGuest || collectionsLength < 1;
const canCreateEnvironment = (isGuest: boolean, totalEnvironments: number) => !isGuest || totalEnvironments < 1;

export const CollectionsScreen = () => {
  const { status, isGuest, user } = useAuth();
  const { workspaces, loading, error, refresh } = useWorkspaces();
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [activeCollection, setActiveCollection] = useState<Collection | null>(null);
  const [customCollections, setCustomCollections] = useState<PixCollection[]>([]);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const collections = useMemo(() => workspaces.flatMap((workspace) => workspace.collections ?? []), [workspaces]);
  const totalEnvironments = useMemo(
    () => collections.reduce((acc, collection) => acc + (collection.environments?.length ?? 0), 0),
    [collections],
  );
  const heroCollection = collections[0];
  const workspaceTypeLabel = useMemo(() => workspaces[0]?.type?.name ?? "Workspace", [workspaces]);
  const totalEndpoints = heroCollection?.endpoint_count ?? 0;

  const workspaceLimitReached = Boolean(!user?.is_premium && workspaces.length >= 1 && !isGuest);
  const canCreateCollectionValue = canCreateCollection(Boolean(isGuest), collections.length);
  const canCreateEnvironmentValue = canCreateEnvironment(Boolean(isGuest), totalEnvironments);

  const connectionState = useMemo(() => {
    if (status === "loading") return "Connecting...";
    if (isGuest) {
      return `Guest session · ${collections.length} collections · ${totalEnvironments} environments`;
    }
    if (status === "authenticated") {
      return `Connected · ${collections.length} collections · ${totalEnvironments} environments`;
    }
    return "Not authenticated";
  }, [collections.length, status, isGuest, totalEnvironments]);

  const upgradeCopy = {
    collections:
      "You can only create 1 collection as a guest. Upgrade to Plus to create unlimited collections.",
    environments:
      "You can only create 1 environment as a guest. Upgrade to Plus to create unlimited environments.",
  } as const;

  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);
  const showUpgradeMessage = (type: keyof typeof upgradeCopy) => {
    setUpgradeMessage(upgradeCopy[type]);
  };
  const clearUpgradeMessage = () => setUpgradeMessage(null);

  useEffect(() => {
    if (!upgradeMessage) return;
    const timer = setTimeout(() => {
      setUpgradeMessage(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [upgradeMessage]);

  useEffect(() => {
    if (!importMessage && !importError) return;
    const timer = setTimeout(() => {
      setImportMessage(null);
      setImportError(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [importMessage, importError]);

  const handleCreateCollection = () => {
    if (!canCreateCollectionValue) {
      showUpgradeMessage("collections");
      return;
    }
    setIsCreatingCollection(true);
  };

  const handleCreateEnvironment = (collection: Collection) => {
    if (!canCreateEnvironmentValue) {
      showUpgradeMessage("environments");
      return;
    }
    setActiveCollection(collection);
  };

  const triggerImportPicker = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const payload = await file.text();
      const parsed = parseCollectionFile(payload);
      setCustomCollections((prev) => [...prev, parsed]);
      setImportMessage(`Imported ${parsed.name}`);
      setImportError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to import file";
      setImportError(message);
      setImportMessage(null);
    } finally {
      event.target.value = "";
    }
  };

  return (
    <>
      <section className="hero-gradient px-8 pt-12 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-widest uppercase">
                  {workspaceTypeLabel}
                </span>
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
                onClick={handleCreateCollection}
                className="cta-gradient text-on-primary px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-2xl shadow-primary/10 hover:brightness-110 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined">playlist_add</span>
                New Collection
              </button>
              <button
                type="button"
                disabled={workspaceLimitReached}
                className={`px-8 py-3 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-all ${
                  workspaceLimitReached
                    ? "border-[#494454]/40 text-[#dae2fd]/50"
                    : "border-outline-variant/30 text-on-surface hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined text-lg">workspace_premium</span>
                Create Workspace
              </button>
              {workspaceLimitReached && (
                <p className="text-xs text-[#f6bc35] uppercase tracking-[0.3em]">
                  Upgrade to premium to create more workspaces
                </p>
              )}
              <button
                type="button"
                onClick={triggerImportPicker}
                className="px-8 py-3 rounded-xl border border-[var(--border)] text-[var(--text)] font-semibold flex items-center justify-center gap-2 hover:bg-[var(--surface)] transition-all"
              >
                <span className="material-symbols-outlined text-lg">upload_file</span>
                Import Collection
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pix,.json,.bru"
                onChange={handleImport}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => exportCollection(sampleCollection)}
                className="px-8 py-3 rounded-xl border border-[var(--border)] text-[var(--text)] font-semibold flex items-center justify-center gap-2 hover:bg-[var(--surface)] transition-all"
              >
                <span className="material-symbols-outlined text-lg">download</span>
                Export Sample (.pix)
              </button>
              <button className="px-8 py-3 rounded-xl border border-outline-variant/30 text-on-surface font-semibold flex items-center justify-center gap-2 hover:bg-surface-container-high transition-all">
                <span className="material-symbols-outlined text-lg">share</span>
                Export Docs
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 text-xs uppercase tracking-[0.4em]">
            <span className={`w-2 h-2 rounded-full ${status === "authenticated" ? "bg-emerald-400" : "bg-amber-400"}`} />
            <span className="text-on-surface-variant">{connectionState}</span>
            {upgradeMessage && (
              <div className="flex items-center gap-2 rounded-full border border-error/60 bg-error/10 px-3 py-1 text-[11px] text-error">
                <span>{upgradeMessage}</span>
                <button type="button" onClick={clearUpgradeMessage} className="text-xs text-error/80 hover:text-error">
                  ×
                </button>
              </div>
            )}
          </div>
          {(importMessage || importError) && (
            <div className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--text)]">
              {importMessage ? (
                <span className="text-[var(--primary)]">{importMessage}</span>
              ) : (
                <span className="text-error">{importError}</span>
              )}
            </div>
          )}
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
              onClick={handleCreateCollection}
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
                  onClick={() => handleCreateEnvironment(collection)}
                  className="px-3 py-1 rounded-full border border-outline-variant/40 text-xs uppercase tracking-[0.4em]"
                >
                  New Environment
                </button>
              </div>
            </article>
          ))}
        </div>
        {customCollections.length > 0 && (
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-6 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-[var(--muted)]">Collections Library</p>
                <h3 className="text-xl font-semibold text-[var(--text)]">Saved collections</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={triggerImportPicker}
                  className="px-4 py-2 rounded-md border border-[var(--border)] text-[var(--text)] text-xs font-semibold uppercase tracking-[0.3em] hover:bg-[var(--surface)] transition-all"
                >
                  Import Collection
                </button>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {customCollections.map((collection, index) => (
                <article
                  key={`${collection.name}-${index}`}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-[var(--text)]">{collection.name}</h4>
                    <span className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                      {collection.requests.length} requests
                    </span>
                  </div>
                  <p className="text-sm text-[var(--muted)]">
                    Stored requests include the URL, method, headers, and body payload as JSON-ready content.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                    {collection.requests.slice(0, 3).map((request) => (
                      <span key={request.name} className="px-2 py-1 rounded-full border border-[var(--border)] bg-[var(--background)]">
                        {request.method.toUpperCase()} · {request.url.replace(/^https?:\/\//, "")}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => exportCollection(collection)}
                      className="px-4 py-2 rounded-md border border-[var(--border)] text-[var(--text)] text-xs font-semibold uppercase tracking-[0.3em] hover:bg-[var(--surface)] transition-all"
                    >
                      Export .pix
                    </button>
                    <span className="text-[var(--muted)] text-[11px]">Share or backup</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
        {!collections.length && !loading && (
          <p className="rounded-2xl border border-dashed border-[#494454]/50 px-6 py-5 text-sm text-on-surface-variant">
            No collections yet. Create one to get started.
          </p>
        )}
      </section>
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
    </>
  );
};
