import { useEffect, useMemo, useState } from "react";
import { apiClient, type CollectionOverviewResponse } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const navLinks = [
  { icon: "folder_open", label: "Collections", active: true },
  { icon: "api", label: "APIs" },
  { icon: "cloud_queue", label: "Environments" },
  { icon: "dns", label: "Mock Servers" },
];

const filters = ["All", "Core", "Admin"];

const formatRelativeUpdated = (timestamp?: string) => {
  if (!timestamp) return "Updated soon";
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffHours = Math.max(0, Math.round(diffMs / 1000 / 60 / 60));
  return diffHours <= 1 ? "Updated moments ago" : `Updated ${diffHours}h ago`;
};

export const CollectionOverviewScreen = () => {
  const { status } = useAuth();
  const [overview, setOverview] = useState<CollectionOverviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    apiClient
      .fetchCollectionOverview()
      .then((payload) => {
        if (active) {
          setOverview(payload);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load collections");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [status]);

  const hero = overview?.hero;
  const quickSpecs = overview?.quick_specs;

  const heroStats = useMemo(() => {
    if (!hero) return [];
    return [
      { label: `${hero.endpoint_count} Endpoints`, icon: "description" },
      { label: formatRelativeUpdated(hero.updated_at), icon: "update" },
      { label: `${hero.access_level === "public" ? "Public" : "Private"} Access`, icon: "public" },
    ];
  }, [hero]);

  const connectionState = useMemo(() => {
    if (status === "loading") {
      return "Connecting...";
    }
    if (status === "authenticated") {
      return `Connected · ${overview ? hero?.endpoint_count || 0 : 0} endpoints`;
    }
    return "Not authenticated";
  }, [status, overview, hero]);

  const statusIndicatorColor = status === "authenticated" ? "bg-emerald-400" : "bg-amber-400";

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden md:flex flex-col h-full border-r border-[#494454]/10 bg-[#131b2e] w-64 flex-shrink-0">
        <div className="p-6 flex flex-col gap-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary-container text-sm">architecture</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-bold text-sm text-on-surface tracking-tight">Project Alpha</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#dae2fd]/50">Engineering Team</span>
            </div>
          </div>
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded bg-surface-container-high text-primary text-xs font-semibold uppercase tracking-widest hover:bg-[#222a3d]/50 transition-all active:scale-95">
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
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-widest uppercase">
                    Collection
                  </span>
                  <span className="text-outline-variant text-xs">•</span>
                  <span className="text-on-surface-variant text-xs font-mono">{hero?.version || "v1.0.0"}</span>
                </div>
                <h1 className="text-5xl font-headline font-black tracking-tighter text-on-surface">{hero?.name || "Project Alpha API"}</h1>
                <p className="text-on-surface-variant text-lg leading-relaxed font-light">
                  {hero?.description ||
                    "Core orchestration endpoints for the Project Alpha infrastructure. This collection manages user lifecycle, cloud resource provisioning, and real-time event streaming for global regions."}
                </p>
                <div className="flex items-center gap-6 pt-2">
                  {heroStats.map((stat) => (
                    <div key={stat.label} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">{stat.icon}</span>
                      <span className="text-sm text-on-surface/80">{stat.label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.4em]">
                  <span className={`w-2 h-2 rounded-full ${status === "authenticated" ? "bg-emerald-400" : "bg-amber-400"}`} />
                  <span className="text-on-surface-variant">{connectionState}</span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button className="cta-gradient text-on-primary px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-2xl shadow-primary/10 hover:brightness-110 active:scale-95 transition-all">
                  <span className="material-symbols-outlined">play_arrow</span>
                  Run Collection
                </button>
                <button className="px-8 py-3 rounded-xl border border-outline-variant/30 text-on-surface font-semibold flex items-center justify-center gap-2 hover:bg-surface-container-high transition-all">
                  <span className="material-symbols-outlined text-lg">share</span>
                  Export Docs
                </button>
              </div>
            </div>
          </div>
        </section>
        <section className="px-8 py-12 max-w-5xl mx-auto w-full">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xs font-headline font-semibold uppercase tracking-[0.2em] text-outline">API Request Catalog</h2>
            <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-lg">
              {filters.map((filter) => (
                <button
                  key={filter}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-widest ${filter === "All" ? "bg-surface-container-high text-primary" : "text-on-surface-variant hover:bg-surface-container-high/50"}`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          {loading && (
            <p className="text-sm text-on-surface-variant">Loading requests...</p>
          )}
          {error && <p className="text-sm text-error/80">{error}</p>}
          {!loading && !error && (
            <div className="grid grid-cols-1 gap-6">
              {(overview?.endpoints ?? []).map((endpoint) => (
                <div
                  key={endpoint.id}
                  className="group relative bg-surface-container-low rounded-xl p-6 hover:bg-surface-container-high transition-all duration-300 border-l-4 border-primary"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-[10px] font-bold tracking-widest px-3 py-1 rounded-full bg-primary/10 text-primary uppercase">
                          {endpoint.method}
                        </span>
                        <span className="font-mono text-sm text-on-surface-variant">{endpoint.route}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-on-surface mb-1">{endpoint.name}</h3>
                        <p className="text-on-surface-variant text-sm leading-relaxed">{endpoint.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {endpoint.access && (
                          <span className="px-2 py-0.5 rounded bg-surface-container-highest text-[10px] font-mono text-outline">
                            Auth: {endpoint.access}
                          </span>
                        )}
                        {endpoint.cache && (
                          <span className="px-2 py-0.5 rounded bg-surface-container-highest text-[10px] font-mono text-outline">
                            Cache: {endpoint.cache}
                          </span>
                        )}
                        {endpoint.priority && (
                          <span className="px-2 py-0.5 rounded bg-surface-container-highest text-[10px] font-mono text-outline">
                            Priority: {endpoint.priority}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="lg:w-48 flex justify-end">
                      <button className="p-3 rounded-full bg-surface-container-highest text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-20 pt-12 border-t border-outline-variant/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-lg">collections</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-on-surface">Agency Handover Bundle</h4>
                <p className="text-xs text-on-surface-variant">Ready for production integration</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-xs font-bold text-primary hover:underline">Read API Policy</button>
              <span className="text-outline-variant">|</span>
              <button className="text-xs font-bold text-primary hover:underline">Contact Support</button>
            </div>
          </div>
        </section>
      </main>
      <aside className="hidden xl:flex flex-col w-80 bg-surface-container-low border-l border-[#494454]/10 p-8 overflow-y-auto">
        <h2 className="text-xs font-headline font-semibold uppercase tracking-[0.2em] text-outline mb-6">
          Quick Specs
        </h2>
        <div className="space-y-8">
          <div>
            <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-3 block">Base URL</span>
            <div className="p-3 bg-surface-container-lowest rounded-lg font-mono text-[11px] text-on-surface-variant border border-outline-variant/5">
              {quickSpecs?.base_url ?? "https://api.alpha.pixend.io"}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-3 block">Authentication</span>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {quickSpecs?.authentication ||
                "Project Alpha uses Bearer tokens for all requests. Tokens must be generated via the /auth/login endpoint and included in the header of every request."}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-3 block">
              Response Formats
            </span>
            <div className="space-y-2">
              {(quickSpecs?.response_formats ?? []).map((format) => (
                <div key={format.name} className="flex items-center justify-between text-xs">
                  <span className="text-on-surface">{format.name}</span>
                  <span className="text-outline text-[10px]">{format.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-6">
            <div className="bg-surface-container-highest rounded-xl p-5 border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary text-sm">bolt</span>
                <h4 className="text-xs font-bold text-on-surface">Health Status</h4>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-medium text-on-surface-variant">
                  {quickSpecs?.health ?? "All regions operational"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
