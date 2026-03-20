const API_BASE_KEY = "pixend_api_base";
const PROXY_ENABLED_KEY = "pixend_proxy_enabled";

const listeners = new Set<() => void>();

const readString = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
};

const writeString = (key: string, value: string | null) => {
  if (typeof window === "undefined") return;
  if (value === null) {
    window.localStorage.removeItem(key);
  } else {
    window.localStorage.setItem(key, value);
  }
};

const notify = () => {
  listeners.forEach((listener) => listener());
};

export const getStoredApiBase = (): string | null => readString(API_BASE_KEY);

export const setStoredApiBase = (value: string | null): void => {
  writeString(API_BASE_KEY, value?.trim() ?? null);
  notify();
};

export const getProxyEnabled = (): boolean => readString(PROXY_ENABLED_KEY) === "true";

export const setProxyEnabled = (value: boolean): void => {
  writeString(PROXY_ENABLED_KEY, value ? "true" : null);
  notify();
};

export const subscribeSettings = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
