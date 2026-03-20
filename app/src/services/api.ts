import { Store } from "@tauri-apps/plugin-store";
import { isGuestMode } from "./guestSession";
import { addGuestCollection } from "./guestStorage";
import type { ThemePalette } from "../lib/themePalettes";

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
    const response = await fetch(fullPath, {
      ...init,
      headers: {
        ...headers,
        ...(init.headers ?? {}),
      },
      signal,
    });

    const headersObj: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headersObj[key] = value;
    });

    const contentType = response.headers.get("content-type");
    let body: T | string | null = null;
    if (contentType?.includes("application/json")) {
      body = await response.json();
    } else if (contentType) {
      body = (await response.text()) as string;
    }

    if (!response.ok) {
      if (response.status === 401 && !opts.skipUnauthorizedHandler && unauthorizedHandler) {
        await unauthorizedHandler();
      }

      const message = (body && typeof body === "object" ? (body as any).message : null) || "Request failed";
      const error = new Error(message) as Error & {
        status?: number;
        details?: Record<string, string[]>;
      };
      error.status = response.status;
      if (body && typeof body === "object" && "errors" in body) {
        error.details = (body as { errors?: Record<string, string[]> }).errors ?? undefined;
      }
      throw error;
    }

    return {
      status: response.status,
      headers: headersObj,
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
