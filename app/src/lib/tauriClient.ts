type PixendTauriWindow = {
  invoke: (args: { cmd: string; payload?: Record<string, unknown> }) => Promise<unknown>;
};

const getGlobalTauriWindow = () =>
  (globalThis as Window & { __TAURI__?: PixendTauriWindow }).__TAURI__;

export const isPixendClient = () => {
  const tauriWindow = getGlobalTauriWindow();
  return typeof tauriWindow !== "undefined" && tauriWindow !== null;
};

export const ensurePixendClient = () => {
  if (!isPixendClient()) {
    throw new Error("This feature is only available inside the Pixend client.");
  }
  return getGlobalTauriWindow() as PixendTauriWindow;
};
