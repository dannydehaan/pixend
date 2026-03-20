import { useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSettings } from "../contexts/SettingsContext";

export const PROXY_URL = import.meta.env.VITE_PIXEND_PROXY_URL ?? "http://localhost:7777/proxy";
export const PROXY_TARGET_HEADER = "x-pixend-target-url";

export const useNetworkProxy = () => {
  const { user } = useAuth();
  const isPaidUser = Boolean(user?.is_premium);
  const { proxyEnabled, setProxyEnabled } = useSettings();

  useEffect(() => {
    if (!isPaidUser && proxyEnabled) {
      setProxyEnabled(false);
    }
  }, [isPaidUser, proxyEnabled, setProxyEnabled]);

  const effectiveProxyEnabled = useMemo(() => (isPaidUser ? proxyEnabled : false), [isPaidUser, proxyEnabled]);

  return {
    isPaidUser,
    proxyEnabled: effectiveProxyEnabled,
    setProxyEnabled,
  };
};
