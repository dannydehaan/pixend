const STORAGE_KEY = "pixend_active_environment";

const listeners = new Set<(value: string | null) => void>();

const isBrowser = () => typeof window !== "undefined";

const readStoredId = (): string | null => {
  if (!isBrowser()) return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored || null;
};

const writeStoredId = (value: string | null) => {
  if (!isBrowser()) return;
  if (value) {
    window.localStorage.setItem(STORAGE_KEY, value);
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
};

export const getActiveEnvironmentId = (): string | null => readStoredId();

export const setActiveEnvironmentId = (value: string | null) => {
  writeStoredId(value);
  listeners.forEach((listener) => listener(value));
};

export const subscribeActiveEnvironmentId = (listener: (value: string | null) => void): (() => void) => {
  listeners.add(listener);
  listener(readStoredId());
  return () => {
    listeners.delete(listener);
  };
};
