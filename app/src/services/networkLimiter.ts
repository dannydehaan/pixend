type TauriInvokeFn = (command: string, args?: Record<string, unknown>) => Promise<unknown>;

const isTauriContext = () => typeof window !== "undefined" && typeof (window as any).__TAURI__ !== "undefined";

const getTauriInvoke = (): TauriInvokeFn | null => {
  if (!isTauriContext()) {
    return null;
  }
  const tauri = (window as any).__TAURI__;
  if (typeof tauri?.invoke !== "function") {
    return null;
  }
  return tauri.invoke.bind(tauri);
};

const ensureInvoke = (): TauriInvokeFn => {
  const invoke = getTauriInvoke();
  if (!invoke) {
    throw new Error("Network limiter is only available inside the Pixend client.");
  }
  return invoke;
};

const normalizeError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }
  return new Error("An unknown error occurred while talking to Pixend.");
};

export type NetworkPreset = {
  preset_id: string;
  label: string;
  enabled: boolean;
  download_kbps: number;
  upload_kbps: number;
  latency_ms: number;
};

export type NetworkProfile = {
  preset_id: string;
  label: string;
  enabled: boolean;
  download_kbps: number;
  upload_kbps: number;
  latency_ms: number;
};

export const listNetworkPresets = async (): Promise<NetworkPreset[]> => {
  const invoke = ensureInvoke();
  try {
    const result = await invoke("list_network_presets");
    return result as NetworkPreset[];
  } catch (error) {
    throw normalizeError(error);
  }
};

export const getNetworkProfile = async (): Promise<NetworkProfile> => {
  const invoke = ensureInvoke();
  try {
    const result = await invoke("get_network_profile");
    return result as NetworkProfile;
  } catch (error) {
    throw normalizeError(error);
  }
};

export const applyNetworkProfile = async (profile: NetworkProfile): Promise<NetworkProfile> => {
  const invoke = ensureInvoke();
  try {
    const result = await invoke("set_network_profile", { profile });
    return result as NetworkProfile;
  } catch (error) {
    throw normalizeError(error);
  }
};
