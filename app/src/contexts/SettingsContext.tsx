import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useEffect } from "react";

type SettingsContextValue = {
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const openSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  const value = useMemo(() => ({ isSettingsOpen, openSettings, closeSettings }), [isSettingsOpen, openSettings, closeSettings]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      if ((isMac && event.metaKey && event.key === ",") || (!isMac && event.ctrlKey && event.key === ",")) {
        event.preventDefault();
        openSettings();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [openSettings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
};
