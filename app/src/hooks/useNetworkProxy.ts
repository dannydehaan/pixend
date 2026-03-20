import { useCallback, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSettings } from "../contexts/SettingsContext";

export const PROXY_URL = import.meta.env.VITE_PIXEND_PROXY_URL ?? "http://localhost:7777/proxy";
export const PROXY_TARGET_HEADER = "x-pixend-target-url";

const isTauriContext = () => typeof window !== "undefined" && typeof (window as any).__TAURI__ !== "undefined";

let proxyRunning = false;

const getTauriInvoke = (): ((command: string, args?: Record<string, unknown>) => Promise<unknown>) | null => {
  if (!isTauriContext()) {
    return null;
  }
  const tauri = (window as any).__TAURI__;
  return typeof tauri?.invoke === "function" ? tauri.invoke.bind(tauri) : null;
};

const invokeProxyCommand = async (command: "start_proxy" | "stop_proxy") => {
  const invokeFn = getTauriInvoke();
  if (!invokeFn) return false;
  try {
    await invokeFn(command);
    return true;
  } catch (error) {
    console.warn(`Proxy ${command} failed`, error);
    return false;
  }
};

export const useNetworkProxy = () => {
  const { user } = useAuth();
  const isPaidUser = Boolean(user?.plan && user.plan !== "free");
  const { proxyEnabled, setProxyEnabled } = useSettings();

  const startProxy = useCallback(async () => {
    if (!isPaidUser || proxyRunning || !isTauriContext()) return;
    proxyRunning = true;
    const started = await invokeProxyCommand("start_proxy");
    if (!started) {
      proxyRunning = false;
      return;
    }
    console.log("Proxy started on port 7777");
  }, [isPaidUser]);

  const stopProxy = useCallback(async () => {
    if (!proxyRunning || !isTauriContext()) return;
    proxyRunning = false;
    const stopped = await invokeProxyCommand("stop_proxy");
    if (stopped) {
      console.log("Proxy stopped");
    }
  }, []);

  useEffect(() => {
    if (!isPaidUser && proxyEnabled) {
      setProxyEnabled(false);
    }
  }, [isPaidUser, proxyEnabled, setProxyEnabled]);

  useEffect(() => {
    if (isPaidUser) {
      startProxy();
    } else {
      stopProxy();
    }
  }, [isPaidUser, startProxy, stopProxy]);

  useEffect(() => {
    startProxy();
    return () => {
      stopProxy();
    };
  }, [startProxy, stopProxy]);

  const effectiveProxyEnabled = useMemo(() => (isPaidUser ? proxyEnabled : false), [isPaidUser, proxyEnabled]);

  return {
    isPaidUser,
    proxyEnabled: effectiveProxyEnabled,
    setProxyEnabled,
  };
};
