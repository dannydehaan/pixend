import { useState } from "react";
import MethodSelector from "./MethodSelector";
import RequestTabs, { type TabOption } from "./RequestTabs";
import UrlInput from "./UrlInput";

const defaultMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const RequestBuilder = () => {
  const [selectedMethod, setSelectedMethod] = useState<string>("GET");
  const [endpoint, setEndpoint] = useState<string>("https://api.pixend.io/v1/users/profile");
  const [activeTab, setActiveTab] = useState<TabOption>("Params");

  return (
    <div className="bg-surface text-on-surface h-screen flex flex-col overflow-hidden">
      <header className="flex justify-between items-center w-full px-6 h-16 backdrop-blur-xl bg-opacity-80 bg-[#0b1326] z-50 shrink-0">
        <div className="flex items-center gap-8">
          <span className="text-xl font-black tracking-tighter text-[#d0bcff] uppercase">Pixend</span>
          <nav className="hidden md:flex items-center gap-6">
            <a className="text-[#d0bcff] font-bold border-b-2 border-[#d0bcff] pb-1 font-['Inter'] tracking-tight text-sm uppercase" href="#">
              Workspace
            </a>
            <a className="text-[#dae2fd]/60 font-medium hover:bg-[#222a3d] transition-colors duration-200 px-2 py-1 rounded font-['Inter'] tracking-tight text-sm uppercase" href="#">
              Environments
            </a>
            <a className="text-[#dae2fd]/60 font-medium hover:bg-[#222a3d] transition-colors duration-200 px-2 py-1 rounded font-['Inter'] tracking-tight text-sm uppercase" href="#">
              History
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-br from-primary to-primary-container text-on-primary-container text-xs font-bold rounded-lg hover:opacity-90 transition-all active:scale-95">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              send
            </span>
            <span>Send</span>
          </button>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <button className="p-2 hover:bg-[#222a3d] rounded-full transition-all">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <button className="p-2 hover:bg-[#222a3d] rounded-full transition-all relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <aside className="hidden md:flex flex-col h-full w-64 bg-[#131b2e] border-r border-[#494454]/10 shrink-0">
          <div className="p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="font-['Inter'] text-xs font-semibold uppercase tracking-widest text-[#d0bcff]">Project Alpha</h2>
                <p className="text-[10px] text-on-surface-variant/60 font-medium uppercase tracking-tighter">Engineering Team</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center overflow-hidden">
                <img
                  alt="User Profile"
                  data-alt="User avatar placeholder with dark aesthetic"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDG9yrmrFkupr8JmVGPrXpIHiJBFpzm67bF4uv1yxiMlP2NP7gKfnSFzT308tRM0CG3GqFNGz5JA57osDVTO_2jjoFmr0Yd1sdneaTKQqwgnW-IToJvMxbA7E-u-lUD8XVTXkDTJH0c6POAEonuuvJgO40SewB1Uqsq88WeKx8mxRXJ-Bo2pASCV8r1pwrF9-noWhym00v59cXqIy0yJMlozlGDdIrtTJuJwAXngddldfcgpKOtbF6PkiZ5jH-IMl52Et-zxCXtdyOZ"
                />
              </div>
            </div>
            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm text-on-surface-variant/40">search</span>
              <input
                className="w-full bg-surface-container-lowest border-none text-xs rounded-lg pl-9 pr-3 py-2.5 focus:ring-1 focus:ring-primary transition-all"
                placeholder="Search Collections"
                type="text"
              />
            </div>
            <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-surface-container-highest text-[#d0bcff] text-xs font-bold rounded-lg border border-primary/20 hover:bg-primary/10 transition-all">
              <span className="material-symbols-outlined text-sm">add_circle</span>
              <span>New Collection</span>
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
            <div className="bg-[#222a3d] text-[#d0bcff] border-r-2 border-[#d0bcff] flex items-center gap-3 px-3 py-2.5 rounded-l-md transition-transform cursor-pointer">
              <span className="material-symbols-outlined text-lg">folder_open</span>
              <span className="font-['Inter'] text-xs font-semibold uppercase tracking-widest">Collections</span>
            </div>
            <div className="pl-4 mt-2 space-y-2">
              <details className="group" open>
                <summary className="flex items-center gap-2 text-on-surface-variant/70 hover:text-on-surface cursor-pointer text-[11px] font-bold uppercase transition-colors">
                  <span className="material-symbols-outlined text-sm transition-transform group-open:rotate-90">chevron_right</span>
                  <span>Auth Service</span>
                </summary>
                <div className="pl-4 mt-1 border-l border-outline-variant/20 space-y-1">
                  <div className="flex items-center gap-2 p-1.5 hover:bg-surface-container-high rounded text-[10px] mono text-secondary transition-all cursor-pointer">
                    <span className="text-[9px] font-black px-1 rounded bg-secondary/10">POST</span>
                    <span>/login</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 hover:bg-surface-container-high rounded text-[10px] mono text-tertiary transition-all cursor-pointer">
                    <span className="text-[9px] font-black px-1 rounded bg-tertiary/10">GET</span>
                    <span>/session</span>
                  </div>
                </div>
              </details>
              <details className="group" open>
                <summary className="flex items-center gap-2 text-on-surface-variant/70 hover:text-on-surface cursor-pointer text-[11px] font-bold uppercase transition-colors">
                  <span className="material-symbols-outlined text-sm transition-transform group-open:rotate-90">chevron_right</span>
                  <span>User API</span>
                </summary>
                <div className="pl-4 mt-1 border-l border-outline-variant/20 space-y-1">
                  <div className="flex items-center gap-2 p-1.5 bg-primary/10 rounded text-[10px] mono text-primary transition-all cursor-pointer border-r-2 border-primary">
                    <span className="text-[9px] font-black px-1 rounded bg-primary/20">GET</span>
                    <span>/v1/users/profile</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 hover:bg-surface-container-high rounded text-[10px] mono text-error transition-all cursor-pointer">
                    <span className="text-[9px] font-black px-1 rounded bg-error/10">DEL</span>
                    <span>/account</span>
                  </div>
                </div>
              </details>
            </div>
            <div className="text-[#dae2fd]/50 hover:text-[#dae2fd] hover:bg-[#222a3d]/50 flex items-center gap-3 px-3 py-2.5 rounded transition-all cursor-pointer mt-4">
              <span className="material-symbols-outlined text-lg">api</span>
              <span className="font-['Inter'] text-xs font-semibold uppercase tracking-widest">APIs</span>
            </div>
            <div className="text-[#dae2fd]/50 hover:text-[#dae2fd] hover:bg-[#222a3d]/50 flex items-center gap-3 px-3 py-2.5 rounded transition-all cursor-pointer">
              <span className="material-symbols-outlined text-lg">cloud_queue</span>
              <span className="font-['Inter'] text-xs font-semibold uppercase tracking-widest">Environments</span>
            </div>
            <div className="text-[#dae2fd]/50 hover:text-[#dae2fd] hover:bg-[#222a3d]/50 flex items-center gap-3 px-3 py-2.5 rounded transition-all cursor-pointer">
              <span className="material-symbols-outlined text-lg">dns</span>
              <span className="font-['Inter'] text-xs font-semibold uppercase tracking-widest">Mock Servers</span>
            </div>
          </nav>
          <footer className="p-4 border-t border-[#494454]/10 space-y-1">
            <div className="text-[#dae2fd]/50 hover:text-[#dae2fd] flex items-center gap-3 px-3 py-2 rounded transition-all cursor-pointer">
              <span className="material-symbols-outlined text-lg">settings</span>
              <span className="font-['Inter'] text-xs font-semibold uppercase tracking-widest">Settings</span>
            </div>
            <div className="text-[#dae2fd]/50 hover:text-[#dae2fd] flex items-center gap-3 px-3 py-2 rounded transition-all cursor-pointer">
              <span className="material-symbols-outlined text-lg">help</span>
              <span className="font-['Inter'] text-xs font-semibold uppercase tracking-widest">Help</span>
            </div>
          </footer>
        </aside>

        <section className="flex-1 flex flex-col bg-surface min-w-0">
          <div className="flex items-center h-10 bg-surface-container-low px-2 gap-1 border-b border-outline-variant/10 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 px-4 h-full bg-surface border-t-2 border-primary text-primary text-xs font-medium mono whitespace-nowrap">
              <span className="text-[10px] font-black">GET</span>
              <span>/v1/users/profile</span>
              <span className="material-symbols-outlined text-[14px] hover:bg-surface-container-highest rounded-full p-0.5 cursor-pointer">close</span>
            </div>
            <div className="flex items-center gap-2 px-4 h-full text-on-surface-variant/40 text-xs font-medium mono whitespace-nowrap hover:bg-surface-container-high transition-colors cursor-pointer">
              <span className="text-[10px] font-black">POST</span>
              <span>/login</span>
              <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100">close</span>
            </div>
            <button className="p-1 hover:bg-surface-container-high rounded text-on-surface-variant/40 ml-2" type="button">
              <span className="material-symbols-outlined text-lg">add</span>
            </button>
          </div>

          <div className="p-6">
            <div className="flex gap-2 items-stretch">
              <MethodSelector methods={defaultMethods} value={selectedMethod} onChange={setSelectedMethod} />
              <UrlInput value={endpoint} onChange={setEndpoint} />
              <button className="px-8 bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-black rounded-lg hover:shadow-[0_0_20px_rgba(208,188,255,0.3)] transition-all active:scale-95" type="button">
                SEND
              </button>
            </div>

            <RequestTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          <div className="flex-1 min-h-0 flex flex-col border-t border-outline-variant/20 bg-surface-container-lowest">
            <div className="flex items-center justify-between px-6 py-3 shrink-0">
              <div className="flex items-center gap-6">
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Response</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 text-green-400 text-[10px] font-black rounded-full border border-green-500/20">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    200 OK
                  </span>
                  <span className="text-[10px] mono text-on-surface-variant/60 font-medium">142ms</span>
                  <span className="text-[10px] mono text-on-surface-variant/60 font-medium">1.2 KB</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-on-surface-variant/60 hover:text-on-surface px-2 py-1 rounded hover:bg-surface-container-high transition-all" type="button">
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                  Copy
                </button>
                <button className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-on-surface-variant/60 hover:text-on-surface px-2 py-1 rounded hover:bg-surface-container-high transition-all" type="button">
                  <span className="material-symbols-outlined text-sm">download</span>
                  Save
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden p-6 pt-0">
              <div className="w-full h-full bg-[#060e20] rounded-xl border border-outline-variant/10 p-6 overflow-auto scrollbar-thin">
                <pre className="mono text-sm leading-relaxed">
{`{\n  "status": "success",\n  "data": {\n    "id": "u_928374",\n    "username": "architect_dev",\n    "email": "contact@pixend.io",\n    "preferences": {\n      "theme": "dark_nocturnal",\n      "notifications": true\n    },\n    "created_at": "2023-11-04T12:00:00Z"\n  }\n}`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        <aside className="hidden lg:flex w-72 h-full bg-[#131b2e] border-l border-[#494454]/10 flex-col overflow-y-auto">
          <div className="p-6 space-y-8">
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#d0bcff] mb-4">Request Context</h3>
              <div className="space-y-4">
                <div className="bg-surface-container-high p-4 rounded-xl">
                  <p className="text-[10px] font-medium text-on-surface-variant/60 uppercase mb-2">Environment</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface">Production (AWS-E1)</span>
                    <span className="material-symbols-outlined text-sm text-primary">cloud_done</span>
                  </div>
                </div>
                <div className="bg-surface-container-high p-4 rounded-xl">
                  <p className="text-[10px] font-medium text-on-surface-variant/60 uppercase mb-2">Auth Status</p>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-secondary">verified</span>
                    <span className="text-xs font-bold text-on-surface">Bearer Token Active</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#d0bcff]">History</h3>
                <span className="text-[10px] text-on-surface-variant/40 hover:text-primary cursor-pointer transition-colors">Clear All</span>
              </div>
              <div className="space-y-2">
                {[
                  { method: "POST", path: "/auth/renew", badge: "text-secondary", time: "2m ago" },
                  { method: "GET", path: "/v1/metrics", badge: "text-tertiary", time: "15m ago" },
                  { method: "DEL", path: "/temp/cache", badge: "text-error", time: "1h ago" },
                ].map((entry) => (
                  <div
                    key={entry.path}
                    className="flex items-center justify-between p-3 bg-surface-container-low hover:bg-surface-container-high rounded-lg cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-black ${entry.badge}`}>{entry.method}</span>
                      <span className="text-[10px] mono text-on-surface-variant">{entry.path}</span>
                    </div>
                    <span className="text-[9px] text-on-surface-variant/30 group-hover:text-on-surface-variant transition-colors">{entry.time}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t border-outline-variant/10">
              <div className="bg-gradient-to-br from-surface-container-high to-surface-container-highest p-4 rounded-xl border border-primary/10">
                <p className="text-[11px] font-bold text-primary uppercase mb-1">Architect Pro</p>
                <p className="text-[10px] text-on-surface-variant/60 leading-relaxed mb-3">
                  Sync your collections across team members in real-time.
                </p>
                <button className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-black rounded-lg transition-all" type="button">
                  UPGRADE NOW
                </button>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <div className="fixed bottom-6 right-6 flex items-center gap-3 bg-surface-container-highest/90 backdrop-blur shadow-2xl px-4 py-3 rounded-xl border border-outline-variant/20 max-w-sm">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
        </div>
        <div>
          <p className="text-xs font-bold text-on-surface">Request successful</p>
          <p className="text-[10px] text-on-surface-variant/60">Response cached for 300 seconds.</p>
        </div>
        <button className="ml-4 text-on-surface-variant/40 hover:text-on-surface" type="button">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  );
};

export default RequestBuilder;
