import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSettings } from "../contexts/SettingsContext";

type PrimaryNavItem = {
  icon: string;
  label: string;
  path: string;
  matches: (pathname: string) => boolean;
};

type UtilityNavItem = {
  icon: string;
  label: string;
};

const primaryNavItems: PrimaryNavItem[] = [
  {
    icon: "folder_open",
    label: "Collections",
    path: "/collections",
    matches: (pathname: string) => pathname === "/" || pathname.startsWith("/collections"),
  },
  {
    icon: "api",
    label: "API Client",
    path: "/api-client",
    matches: (pathname: string) => pathname.startsWith("/api-client"),
  },
  {
    icon: "network_ping",
    label: "Network",
    path: "/network",
    matches: (pathname: string) => pathname.startsWith("/network"),
  },
];

const utilityNavItems: UtilityNavItem[] = [
  { icon: "cloud_queue", label: "Environments" },
  { icon: "dns", label: "Mock Servers" },
];

export const WorkspaceLayout = () => {
  const { isGuest, user } = useAuth();
  const isPaidUser = Boolean(user?.plan && user.plan !== "free");
  const navigate = useNavigate();
  const location = useLocation();

  const { openSettings, closeSettings } = useSettings();
  const isEnvironmentsActive = location.pathname.startsWith("/environments");
  const handlePrimaryNavClick = (path: string) => {
    closeSettings();
    navigate(path);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface text-on-surface">
      <aside
        className="hidden md:flex flex-col h-full w-64 flex-shrink-0"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
      >
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
            onClick={() => navigate("/collections")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded bg-[var(--surface)] text-[var(--primary)] text-xs font-semibold uppercase tracking-widest hover:bg-[var(--border)]/40 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Collection
          </button>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {primaryNavItems.map((link) => {
            const isActive = link.matches(location.pathname);
            return (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => handlePrimaryNavClick(link.path)}
                className={`flex items-center gap-3 px-3 py-3 rounded transition-all text-xs font-semibold uppercase tracking-widest ${
                  isActive
                    ? "bg-[var(--border)] text-[var(--primary)] border-r-2 border-[var(--primary)]"
                    : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--border)]/40"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                <span>{link.label}</span>
              </button>
            );
          })}
          <div className="mt-2 space-y-1 border-t pt-3" style={{ borderColor: "var(--border)" }}>
            {utilityNavItems.map((link) => {
              const isEnvironmentLink = link.label === "Environments";
              const isActive = isEnvironmentLink && isEnvironmentsActive;
              return (
                <button
                  type="button"
                  key={link.label}
                  onClick={() => {
                    if (isEnvironmentLink) {
                      navigate("/environments");
                    }
                  }}
                  className={`flex items-center gap-3 px-3 py-3 rounded text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--border)]/40 transition-all ${
                    isActive ? "border-l-2 border-primary text-[var(--primary)]" : ""
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                  <span className="text-xs font-semibold uppercase tracking-widest">{link.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
        {isGuest && (
          <div className="p-4 border-t space-y-2" style={{ borderColor: "var(--border)" }}>
            <p className="text-[11px] text-[var(--muted)] uppercase tracking-[0.4em]">
              Create an account to sync your data across devices.
            </p>
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded bg-[var(--primary)] text-[var(--text)] text-xs font-semibold uppercase tracking-[0.3em] hover:bg-[var(--primary)]/90 transition-all"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              Create Account
            </button>
          </div>
        )}
        <div className="p-3 border-t flex flex-col gap-1" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3 px-3 py-3 rounded text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--border)]/40 transition-all cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span className="text-xs font-semibold uppercase tracking-widest">Settings</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-3 rounded text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--border)]/40 transition-all cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">help</span>
            <span className="text-xs font-semibold uppercase tracking-widest">Help</span>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col h-full bg-surface overflow-y-auto">
        <header
          className="sticky top-0 z-50 flex justify-between items-center w-full px-6 h-16 backdrop-blur-xl border-none"
          style={{ backgroundColor: "var(--surface)" }}
        >
          <div className="flex items-center gap-8">
            <span className="text-xl font-black tracking-tighter uppercase text-[var(--primary)]">Pixend</span>
            <nav className="hidden lg:flex items-center gap-6">
              <a className="font-['Inter'] tracking-tight text-sm font-bold text-[var(--primary)] border-b-2 border-[var(--primary)] pb-1" href="#">
                Workspace
              </a>
              <a className="font-['Inter'] tracking-tight text-sm font-medium text-[var(--muted)] hover:text-[var(--text)]" href="#">
                Environments
              </a>
              <a className="font-['Inter'] tracking-tight text-sm font-medium text-[var(--muted)] hover:text-[var(--text)]" href="#">
                History
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded hover:bg-[var(--border)]/40 transition-colors duration-200 text-[var(--muted)]"
                onClick={openSettings}
              >
                <span className="material-symbols-outlined">settings</span>
              </button>
              <button className="p-2 rounded hover:bg-[var(--border)]/40 transition-colors duration-200 text-[var(--muted)]">
                <span className="material-symbols-outlined">notifications</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              {isGuest && (
                <button
                  type="button"
                  onClick={() => navigate("/login", { replace: true })}
                  className="px-5 py-1.5 rounded-lg border border-[var(--border)] border-opacity-70 text-xs uppercase tracking-[0.3em] text-[var(--primary)] hover:border-[var(--primary)]"
                >
                  Login / Upgrade
                </button>
              )}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
