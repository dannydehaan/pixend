import { Store } from "@tauri-apps/plugin-store";

const STORE_NAME = "secure-storage";

const isBrowser = () => typeof window !== "undefined";
const isTauri = () =>
  isBrowser() && typeof (window as Window & { __TAURI_IPC__?: unknown }).__TAURI_IPC__ !== "undefined";

let storeInstance: Store | null = null;
let storeInit: Promise<Store | null> | null = null;

const getStore = async (): Promise<Store | null> => {
  if (!isTauri()) return null;
  if (storeInstance) return storeInstance;
  if (!storeInit) {
    storeInit = (async () => {
      try {
        const existing = await Store.get(STORE_NAME);
        const instance = existing ?? (await Store.load(STORE_NAME));
        storeInstance = instance;
        return instance;
      } catch (error) {
        console.warn("Failed to initialize secure store", error);
        storeInit = null;
        storeInstance = null;
        return null;
      }
    })();
  }
  return storeInit;
};

const sessionStorageFallback = () => {
  if (!isBrowser()) return null;
  return window.sessionStorage;
};

export async function setSecureValue(key: string, value: string): Promise<void> {
  const store = await getStore();
  if (store) {
    await store.set(key, value);
    await store.save();
    return;
  }
  const session = sessionStorageFallback();
  session?.setItem(key, value);
}

export async function getSecureValue(key: string): Promise<string | null> {
  const store = await getStore();
  if (store) {
    const stored = await store.get<string>(key);
    return typeof stored === "string" ? stored : null;
  }
  const session = sessionStorageFallback();
  return session?.getItem(key) ?? null;
}

export async function deleteSecureValue(key: string): Promise<void> {
  const store = await getStore();
  if (store) {
    await store.delete(key);
    await store.save();
    return;
  }
  const session = sessionStorageFallback();
  session?.removeItem(key);
}
