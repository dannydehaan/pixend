import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getStoredApiBase,
  getProxyEnabled,
  setProxyEnabled as persistProxyEnabled,
  setStoredApiBase,
  subscribeSettings,
} from "../services/settingsStorage";

type SettingsContextValue = {
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  apiBase: string;
  proxyEnabled: boolean;
  setApiBase: (value: string) => void;
  setProxyEnabled: (value: boolean) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiBase, setApiBaseValue] = useState<string>(() => getStoredApiBase() ?? "");
  const [proxyEnabled, setProxyEnabledValue] = useState<boolean>(() => getProxyEnabled());

  const openSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  useEffect(() => {
    const unsubscribe = subscribeSettings(() => {
      setApiBaseValue(getStoredApiBase() ?? "");
      setProxyEnabledValue(getProxyEnabled());
    });
    return unsubscribe;
  }, []);

  const updateApiBase = useCallback((value: string) => {
    setStoredApiBase(value.trim() === "" ? null : value);
  }, []);

  const toggleProxy = useCallback((value: boolean) => {
    persistProxyEnabled(value);
  }, []);

  const value = useMemo(
    () => ({
      isSettingsOpen,
      openSettings,
      closeSettings,
      apiBase,
      proxyEnabled,
      setApiBase: updateApiBase,
      setProxyEnabled: toggleProxy,
    }),
    [apiBase, closeSettings, isSettingsOpen, openSettings, proxyEnabled, toggleProxy, updateApiBase],
  );

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
