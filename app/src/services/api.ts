import { Store } from "@tauri-apps/plugin-store";
import { isGuestMode } from "./guestSession";
import { addGuestCollection } from "./guestStorage";
import { sendRequest } from "../lib/httpClient";
import type { ThemePalette } from "../lib/themePalettes";

let apiBaseOverride: string | null = null;
export const setApiBase = (value: string) => {
  apiBaseOverride = value;
};

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const isApiBaseAbsolute = (value: string) => {
  return /^(?:[a-z]+:)?\/\//i.test(value);
};

const getDefaultEnvApiBase = () => stripTrailingSlash(import.meta.env.VITE_APP_API_BASE ?? "");

const shouldUseBrowserFallback = (candidate: string) => {
  return (
    import.meta.env.DEV &&
    isBrowser() &&
    !isTauri() &&
    candidate.length > 0 &&
    isApiBaseAbsolute(candidate)
  );
};

const getEnvApiBase = () => {
  const configured = apiBaseOverride ?? import.meta.env.VITE_APP_API_BASE ?? "";
  const trimmed = configured.trim();
  if (!trimmed) {
    throw new Error("Missing VITE_APP_API_BASE environment variable");
  }
  const normalized = stripTrailingSlash(trimmed);
  if (shouldUseBrowserFallback(normalized)) {
    const fallback = getDefaultEnvApiBase();
    if (!fallback) {
      throw new Error("Browser mode cannot use an absolute API base when no fallback is configured.");
    }
    console.warn(
      `[apiClient] Detected absolute API base ${normalized} while running in browser dev mode; ` +
        `falling back to ${fallback} so the dev proxy can be used. Remove the override if you need to call a remote server against CORS.`,
    );
    return fallback;
  }
  return normalized;
};
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
  skipUnauthorizedHandler?: boolean;
};

const buildHeaders = async (includeAuth = true): Promise<HeadersInit> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (includeAuth) {
    if (isGuestMode()) {
      return headers;
    }
    const token = await getToken();
    if (!token) {
      throw new Error("Missing authentication token");
    }

    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const pendingRequests = new Map<string, Promise<unknown>>();

type UnauthorizedHandler = () => Promise<void>;
let unauthorizedHandler: UnauthorizedHandler | null = null;
export const setUnauthorizedHandler = (handler: UnauthorizedHandler | null) => {
  unauthorizedHandler = handler;
};

const createRequestKey = (path: string, init: RequestInit, opts: RequestOpts): string => {
  const method = (init.method ?? "GET").toUpperCase();
  return opts.dedupeKey ?? `${method}:${path}`;
};

const isAbsoluteUrl = (value: string) => /^(?:[a-z]+:)?\/\//i.test(value);

const request = async <T>(
  path: string,
  init: RequestInit = {},
  opts: RequestOpts = {},
): Promise<{ status: number; headers: Record<string, string>; body: T | string | null }> => {
  const isExternal = isAbsoluteUrl(path);
  if (isGuestMode() && !isExternal) {
    throw new Error("Guest mode prevents internal Pixend API requests");
  }
  const includeAuth = opts.auth ?? true;
  const apiBase = ensureApiBase();
  const fullPath = isAbsoluteUrl(path) ? path : `${apiBase}${path}`;
  const key = createRequestKey(path, init, opts);

  if (!opts.force && pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>;
  }

  const controller = new AbortController();
  const signal = opts.signal ?? controller.signal;
  const headers = await buildHeaders(includeAuth);

    const fetchPromise = (async () => {
      const contentTypeHeader = ((init.headers as Record<string, string>)?.["Content-Type"] ?? "").toLowerCase();
      const bodyType = contentTypeHeader.includes("application/json") && typeof init.body === "string" ? "json" : "none";
      const result = await sendRequest({
        url: fullPath,
        method: (init.method ?? "GET").toUpperCase(),
        headers: {
          ...headers,
          ...(init.headers ?? {}),
        },
        bodyType,
        body: typeof init.body === "string" ? init.body : undefined,
        signal,
      });

      if (result.error) {
        throw result.error;
      }

      if (!result.response) {
        throw new Error("Request cancelled");
      }

      const contentType = (result.response.headers["content-type"] ?? "").toLowerCase();
      let body: T | string | null = null;
      if (contentType.includes("application/json")) {
        try {
          body = JSON.parse(result.response.body) as T;
        } catch {
          body = result.response.body;
        }
      } else if (result.response.body) {
        body = result.response.body;
      }
      return {
        status: result.response.status,
        headers: result.response.headers,
        body,
      };
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
  plan?: string;
  is_premium?: boolean;
  encryption_salt?: string | null;
  preferred_theme?: string;
};

export type WorkspaceType = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  sync_enabled: boolean;
  requires_organization: boolean;
};

export type Environment = {
  id: number;
  collection_id: number;
  name: string;
  region: string | null;
  description: string | null;
  settings: Record<string, unknown> | null;
  created_at: string;
};

export type Collection = {
  id: number;
  workspace_id: number;
  name: string;
  description: string | null;
  endpoint_count: number;
  status: string;
  access_level: string;
  created_at: string;
  environments?: Environment[];
};

export type Workspace = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  users?: UserSummary[];
  collections?: Collection[];
  type?: WorkspaceType;
  organization?: {
    id: number;
    name: string;
    slug: string;
  };
};

export type CollectionOverviewEndpoint = {
  id: number;
  name: string;
  method: string;
  route: string;
  description: string;
  category: string | null;
  cache: string | null;
  priority: string | null;
  access: string | null;
};

export type CollectionOverviewResponse = {
  hero: {
    name: string;
    version: string;
    description: string;
    endpoint_count: number;
    updated_at: string | null;
    access_level: string;
    status: string;
  };
  endpoints: CollectionOverviewEndpoint[];
  quick_specs: {
    base_url: string;
    authentication: string;
    response_formats: { name: string; label: string }[];
    health: string;
  };
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

export type CreateCollectionPayload = {
  name: string;
  workspace_id: number;
  description?: string;
};

export type CreateEnvironmentPayload = {
  collection_id: number;
  name: string;
  region?: string;
  description?: string;
  settings?: Record<string, unknown>;
};

export type AuthResponse = {
  user: UserSummary;
  token: string;
};

export const apiClient = {
  async register(payload: RegisterPayload) {
    const response = await request<AuthResponse>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      { auth: false },
    );
    return response.body as AuthResponse;
  },

  async login(payload: LoginPayload) {
    const response = await request<AuthResponse>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      { auth: false },
    );
    return response.body as AuthResponse;
  },

  async logout() {
    await request<void>(
      "/auth/logout",
      {
        method: "POST",
      },
    );
  },

  async fetchCollectionOverview() {
    const response = await request<{ data: CollectionOverviewResponse }>("/collections/overview", { method: "GET" });
    return response.body?.data as CollectionOverviewResponse;
  },

  async fetchWorkspaces(options?: { signal?: AbortSignal }) {
    const response = await request<{ data: Workspace[] }>(
      "/workspaces",
      { method: "GET" },
      { signal: options?.signal },
    );
    return response.body?.data as Workspace[];
  },

  async createCollection(payload: CreateCollectionPayload) {
    if (isGuestMode()) {
      const collection = await addGuestCollection({
        workspaceId: payload.workspace_id,
        name: payload.name,
        description: payload.description,
      });
      return collection;
    }
    const response = await request<{ data: Collection }>(
      "/collections",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
    return response.body?.data as Collection;
  },

  async createEnvironment(payload: CreateEnvironmentPayload) {
    const response = await request<{ data: Environment }>(
      "/environments",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
    return response.body?.data as Environment;
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

  async validateToken(options?: { signal?: AbortSignal }) {
    const response = await request<{ user: UserSummary }>("/auth/me", {
      method: "GET",
    }, {
      dedupeKey: "GET:/auth/me",
      signal: options?.signal,
      skipUnauthorizedHandler: true,
    });
    return response.body as { user: UserSummary };
  },

  async fetchThemes() {
    const response = await request<{ themes: ThemePalette[] }>("/themes", {
      method: "GET",
    }, {
      auth: false,
    });
    return response.body?.themes ?? [];
  },

  async fetchUserTheme() {
    const response = await request<{ theme: ThemePalette }>("/user/theme", {
      method: "GET",
    });
    return response.body?.theme;
  },

  async updateUserThemePreference(themeId: string) {
    const response = await request<{ theme: ThemePalette }>("/user/theme", {
      method: "PATCH",
      body: JSON.stringify({ theme: themeId }),
    });
    return response.body?.theme;
  },
};

export type ApiClient = typeof apiClient;
export { request };
