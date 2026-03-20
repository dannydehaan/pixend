import { useMemo } from "react";
import { useSettings } from "../contexts/SettingsContext";

type UpgradePromptProps = {
  title?: string;
  description?: string;
  actionCopy?: string;
};

const UpgradePrompt = ({
  title = "Upgrade required",
  description = "The Network Inspector and API proxy are reserved for paid plans.",
  actionCopy = "Upgrade and enable proxy",
}: UpgradePromptProps) => {
  const { openSettings } = useSettings();
  const footerMessage = useMemo(
    () => `Upgrade to a paid plan to unlock the full debugging and inspection workflows.`,
    [],
  );

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-outline-variant/60 bg-[var(--surface)] p-10 text-center text-on-surface-variant shadow-lg shadow-black/20">
      <span className="material-symbols-outlined text-4xl text-primary">lock</span>
      <h2 className="text-xl font-bold text-on-surface">{title}</h2>
      <p className="max-w-sm text-sm text-on-surface-variant">{description}</p>
      <button
        type="button"
        onClick={openSettings}
        className="rounded-full border border-primary px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary hover:bg-primary/10 transition-all"
      >
        {actionCopy}
      </button>
      <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">{footerMessage}</p>
    </div>
  );
};

export default UpgradePrompt;
