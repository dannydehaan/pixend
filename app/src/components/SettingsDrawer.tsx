import ThemeSwitcher from "./theme/ThemeSwitcher";
import { useSettings } from "../contexts/SettingsContext";

const SettingsDrawer = () => {
  const { isSettingsOpen, closeSettings } = useSettings();

  if (!isSettingsOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex">
      <div className="absolute inset-0 bg-black/60" onClick={closeSettings} />
      <div
        className="relative ml-auto h-full w-[360px] bg-[var(--surface)] border-l border-[var(--border)] p-6 shadow-2xl text-[var(--text)] transition-transform"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold tracking-[0.3em] uppercase">Settings</h2>
          <button
            type="button"
            className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]"
            onClick={closeSettings}
          >
            Close
          </button>
        </div>
        <section className="space-y-6">
          <div className="space-y-2">
            <p className="text-[0.65rem] uppercase tracking-[0.4em] text-[var(--muted)]">Theme</p>
            <ThemeSwitcher />
          </div>
          {/* additional settings sections reserved here */}
        </section>
      </div>
    </div>
  );
};

export default SettingsDrawer;
