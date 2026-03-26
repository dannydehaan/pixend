type PixendTauriWindow = {
  invoke: (args: { cmd: string; payload?: Record<string, unknown> }) => Promise<unknown>;
};

const getGlobalTauriWindow = () => {
  const windowCandidate = globalThis as Window &
    Partial<{
      __TAURI__: PixendTauriWindow;
      __TAURI_IPC__: PixendTauriWindow;
    }>;

  return windowCandidate.__TAURI__ ?? windowCandidate.__TAURI_IPC__ ?? null;
};

let hasLoggedDetection = false;

export const isTauriApp = () => {
  const tauriWindow = getGlobalTauriWindow();
  const detected = Boolean(tauriWindow);
  if (!hasLoggedDetection && typeof window !== "undefined") {
    hasLoggedDetection = true;
    // eslint-disable-next-line no-console
    console.log("isTauriApp:", detected);
    // eslint-disable-next-line no-console
    console.log("window.__TAURI__:", (window as any).__TAURI__);
    // eslint-disable-next-line no-console
    console.log("window.__TAURI_IPC__:", (window as any).__TAURI_IPC__);
    if (typeof navigator !== "undefined") {
      // eslint-disable-next-line no-console
      console.log("userAgent:", navigator.userAgent);
    }
  }
  return detected;
};

export const isPixendClient = () => Boolean(getGlobalTauriWindow());

export const ensurePixendClient = () => {
  const tauriWindow = getGlobalTauriWindow();
  if (!tauriWindow) {
    throw new Error("This feature is only available inside the Pixend client.");
  }
  return tauriWindow;
};
