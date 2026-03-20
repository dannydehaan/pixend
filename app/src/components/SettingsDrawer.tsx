import { useEffect, useState } from "react";
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
          <div className="space-y-4">
            <p className="text-[0.65rem] uppercase tracking-[0.4em] text-[var(--muted)]">API Proxy</p>
            <div className="space-y-2">
              <label className="text-[0.65rem] uppercase tracking-[0.4em] text-[var(--muted)] block">API Base URL</label>
              <ApiBaseField />
            </div>
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-[var(--muted)]">
              <span>Enable proxy</span>
              <ProxyToggle />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const ApiBaseField = () => {
  const { apiBase, setApiBase } = useSettings();
  const [value, setValue] = useState(apiBase);

  useEffect(() => {
    setValue(apiBase);
  }, [apiBase]);

  const handleBlur = () => {
    setApiBase(value);
  };

  return (
    <input
      type="url"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={handleBlur}
      placeholder="https://api.example.com"
      className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm bg-[var(--surface)] focus:border-primary focus:outline-none"
    />
  );
};

const ProxyToggle = () => {
  const { proxyEnabled, setProxyEnabled } = useSettings();

  return (
    <button
      type="button"
      onClick={() => setProxyEnabled(!proxyEnabled)}
      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${
        proxyEnabled ? "bg-primary" : "bg-outline-variant/40"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-surface transition-transform ${
          proxyEnabled ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
};

export default SettingsDrawer;
