import { Store } from "@tauri-apps/plugin-store";

let apiBaseOverride: string | null = null;
export const setApiBase = (value: string) => {
  apiBaseOverride = value;
};

const getEnvApiBase = () => apiBaseOverride ?? import.meta.env.VITE_APP_API_BASE;
const TOKEN_KEY = "pixend_token";

const isBrowser = () => typeof window !== "undefined";
const isTauri = () => isBrowser() && typeof (window as Window & { __TAURI_IPC__?: unknown }).__TAURI_IPC__ !== "undefined";

let storeInstance: Store | null = null;
let storeInit: Promise<Store | null> | null = null;

const getStore = async (): Promise<Store | null> => {
  if (!isTauri()) return null;
  if (storeInstance) return storeInstance;
  if (!storeInit) {
    storeInit = (async () => {
      try {
        const existing = await Store.get("session");
        const instance = existing ?? (await Store.load("session"));
        storeInstance = instance;
        return instance;
      } catch (error) {
        console.error("Failed to initialize store", error);
        storeInit = null;
        storeInstance = null;
        return null;
      }
    })();
  }
  return storeInit;
};

const readLocal = (): string | null => {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(TOKEN_KEY);
};

const writeLocal = (value: string) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(TOKEN_KEY, value);
};

const removeLocal = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(TOKEN_KEY);
};

export const getToken = async (): Promise<string | null> => {
  const store = await getStore();
  if (store) {
    const stored = await store.get(TOKEN_KEY);
    if (typeof stored === "string") {
      return stored;
    }
  }
  return readLocal();
};

export const setToken = async (value: string): Promise<void> => {
  const store = await getStore();
  if (store) {
    await store.set(TOKEN_KEY, value);
    await store.save();
  }
  writeLocal(value);
};

export const clearToken = async (): Promise<void> => {
  const store = await getStore();
  if (store) {
    await store.delete(TOKEN_KEY);
    await store.save();
  }
  removeLocal();
};

const ensureApiBase = (): string => {
  const apiBase = getEnvApiBase();
  if (!apiBase) {
    throw new Error("Missing VITE_APP_API_BASE environment variable");
  }

  return apiBase.replace(/\/+$/, "");
};

type RequestOpts = {
  auth?: boolean;
  dedupeKey?: string;
  signal?: AbortSignal;
  force?: boolean;
};

const buildHeaders = async (includeAuth = true): Promise<HeadersInit> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (includeAuth) {
    const token = await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
};

const pendingRequests = new Map<string, Promise<unknown>>();

const createRequestKey = (path: string, init: RequestInit, opts: RequestOpts): string => {
  const method = (init.method ?? "GET").toUpperCase();
  return opts.dedupeKey ?? `${method}:${path}`;
};

const request = async <T>(
  path: string,
  init: RequestInit = {},
  opts: RequestOpts = {},
): Promise<T> => {
  const includeAuth = opts.auth ?? true;
  const apiBase = ensureApiBase();
  const key = createRequestKey(path, init, opts);

  if (!opts.force && pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>;
  }

  const controller = new AbortController();
  const signal = opts.signal ?? controller.signal;
  const headers = await buildHeaders(includeAuth);

  const fetchPromise = (async () => {
    const response = await fetch(`${apiBase}${path}`, {
      ...init,
      headers: {
        ...headers,
        ...(init.headers ?? {}),
      },
      signal,
    });

    const contentType = response.headers.get("content-type");
    const body = contentType?.includes("application/json") ? await response.json() : null;

    if (!response.ok) {
      const message = body?.message || "Request failed";
      const error = new Error(message) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }

    return body as T;
  })();

  pendingRequests.set(key, fetchPromise);

  try {
    return await fetchPromise;
  } finally {
    if (pendingRequests.get(key) === fetchPromise) {
      pendingRequests.delete(key);
    }
  }
};

export type UserSummary = {
  id: number;
  name: string;
  email: string;
};

export type Workspace = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  users?: UserSummary[];
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthResponse = {
  user: UserSummary;
  token: string;
};

export const apiClient = {
  register(payload: RegisterPayload) {
    return request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }, { auth: false });
  },

  login(payload: LoginPayload) {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }, { auth: false });
  },

  logout() {
    return request<void>("/auth/logout", {
      method: "POST",
    });
  },

  fetchWorkspaces() {
    return request<{ data: Workspace[] }>("/workspaces", { method: "GET" }).then((data) => data.data);
  },

  getPersistedToken() {
    return getToken();
  },

  persistToken(value: string) {
    return setToken(value);
  },

  clearToken() {
    return clearToken();
  },

  validateToken(options?: { signal?: AbortSignal }) {
    return request<{ user: UserSummary }>("/auth/me", {
      method: "GET",
    }, {
      dedupeKey: "GET:/auth/me",
      signal: options?.signal,
    });
  },
};

export type ApiClient = typeof apiClient;
