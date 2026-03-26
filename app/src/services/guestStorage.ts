import { Store } from "@tauri-apps/plugin-store";
import type { Collection, Environment, Workspace, WorkspaceType } from "./api";

const DATA_STORE_NAME = "guest-workspace";
const DATA_KEY = "data";
const FALLBACK_KEY = "pixend_guest_data";

const isBrowser = () => typeof window !== "undefined";
const isTauri = () =>
  isBrowser() && typeof (window as Window & { __TAURI_IPC__?: unknown }).__TAURI_IPC__ !== "undefined";

let guestStoreInstance: Store | null = null;
let guestStoreInit: Promise<Store | null> | null = null;

const getGuestStore = async (): Promise<Store | null> => {
  if (!isTauri()) {
    return null;
  }

  if (guestStoreInstance) {
    return guestStoreInstance;
  }

  if (!guestStoreInit) {
    guestStoreInit = (async () => {
      try {
        const existing = await Store.get(DATA_STORE_NAME);
        const instance = existing ?? (await Store.load(DATA_STORE_NAME));
        guestStoreInstance = instance;
        return instance;
      } catch (error) {
        console.error("Failed to initialize guest store", error);
        guestStoreInit = null;
        guestStoreInstance = null;
        return null;
      }
    })();
  }

  return guestStoreInit;
};

type GuestMeta = {
  nextWorkspaceId: number;
  nextCollectionId: number;
  nextEnvironmentId: number;
};

type GuestPayload = {
  workspaces: Workspace[];
  meta: GuestMeta;
};

const defaultWorkspaceType: WorkspaceType = {
  id: 0,
  slug: "local",
  name: "Local Workspace",
  description: "Offline workspace synced to this device.",
  sync_enabled: false,
  requires_organization: false,
};

const defaultWorkspace: Workspace = {
  id: 1,
  name: "Local Workspace",
  slug: "local-workspace",
  description: "Workspace stored locally for guest sessions.",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  type: defaultWorkspaceType,
  collections: [],
};

const defaultMeta: GuestMeta = {
  nextWorkspaceId: 2,
  nextCollectionId: 1,
  nextEnvironmentId: 1,
};

const ensureCollections = (collections: Collection[] | undefined): Collection[] =>
  (collections ?? []).map((collection) => ({
    ...collection,
    environments: collection.environments ?? [],
  }));

const createWorkspaceSnapshot = (workspace: Partial<Workspace>): Workspace => ({
  ...defaultWorkspace,
  ...workspace,
  collections: ensureCollections(workspace.collections),
});

const readFallback = (): GuestPayload | null => {
  if (!isBrowser()) {
    return null;
  }

  try {
    const value = window.localStorage.getItem(FALLBACK_KEY);
    if (!value) {
      return null;
    }

    return JSON.parse(value) as GuestPayload;
  } catch {
    return null;
  }
};

const writeFallback = (value: GuestPayload) => {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(FALLBACK_KEY, JSON.stringify(value));
  } catch {
    // ignore
  }
};

const ensurePayload = (payload?: GuestPayload): GuestPayload => {
  const workspaces = (payload?.workspaces ?? [defaultWorkspace]).map((workspace) =>
    createWorkspaceSnapshot(workspace),
  );
  const meta: GuestMeta = {
    nextWorkspaceId: Math.max(payload?.meta?.nextWorkspaceId ?? defaultMeta.nextWorkspaceId, 2),
    nextCollectionId: Math.max(payload?.meta?.nextCollectionId ?? defaultMeta.nextCollectionId, 1),
    nextEnvironmentId: Math.max(payload?.meta?.nextEnvironmentId ?? defaultMeta.nextEnvironmentId, 1),
  };

  return {
    workspaces,
    meta,
  };
};

const readGuestData = async (): Promise<GuestPayload> => {
  const store = await getGuestStore();
  if (store) {
    const stored = await store.get(DATA_KEY);
    if (stored && typeof stored === "object") {
      return ensurePayload(stored as GuestPayload);
    }
  }

  return ensurePayload(readFallback() ?? undefined);
};

const writeGuestData = async (payload: GuestPayload): Promise<void> => {
  const store = await getGuestStore();
  if (store) {
    await store.set(DATA_KEY, payload);
    await store.save();
  }
  writeFallback(payload);
};

const normalizeSlug = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const generateUniqueSlug = (name: string, existing: Set<string>): string => {
  const base = normalizeSlug(name) || "workspace";
  let slug = base;
  let counter = 1;
  while (existing.has(slug)) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
};

export const loadGuestWorkspaces = async (): Promise<Workspace[]> => {
  const data = await readGuestData();
  return data.workspaces.map((workspace) => createWorkspaceSnapshot(workspace));
};

export const loadGuestWorkspace = async (): Promise<Workspace> => {
  const workspaces = await loadGuestWorkspaces();
  return workspaces[0];
};

export const createGuestWorkspace = async (options: {
  name: string;
  description?: string;
}): Promise<Workspace> => {
  const data = await readGuestData();
  const existingSlugs = new Set(data.workspaces.map((workspace) => workspace.slug));
  const workspace: Workspace = createWorkspaceSnapshot({
    id: data.meta.nextWorkspaceId,
    name: options.name.trim(),
    slug: generateUniqueSlug(options.name.trim(), existingSlugs),
    description: options.description ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    collections: [],
  });

  data.workspaces = [...data.workspaces, workspace];
  data.meta.nextWorkspaceId += 1;

  await writeGuestData(data);
  return workspace;
};

export const addGuestCollection = async (options: {
  workspaceId: number;
  name: string;
  description?: string;
}): Promise<Collection> => {
  const data = await readGuestData();
  const workspaceIndex = data.workspaces.findIndex((workspace) => workspace.id === options.workspaceId);
  if (workspaceIndex === -1) {
    throw new Error("Workspace not found");
  }

  const workspace = data.workspaces[workspaceIndex];
  const collection: Collection = {
    id: data.meta.nextCollectionId,
    workspace_id: options.workspaceId,
    name: options.name,
    description: options.description ?? null,
    endpoint_count: 0,
    status: "draft",
    access_level: "private",
    created_at: new Date().toISOString(),
    environments: [],
  };

  data.meta.nextCollectionId += 1;
  const updatedWorkspace = {
    ...workspace,
    collections: [...(workspace.collections ?? []), collection],
    updated_at: new Date().toISOString(),
  };

  data.workspaces = data.workspaces.map((value, index) =>
    index === workspaceIndex ? updatedWorkspace : value,
  );

  await writeGuestData(data);
  return collection;
};

export const addGuestEnvironment = async (options: {
  collectionId: number;
  name: string;
  region?: string;
  description?: string;
  settings?: Record<string, unknown>;
}): Promise<Environment> => {
  const data = await readGuestData();
  const workspaceIndex = data.workspaces.findIndex((workspace) =>
    (workspace.collections ?? []).some((collection) => collection.id === options.collectionId),
  );
  if (workspaceIndex === -1) {
    throw new Error("Collection not found");
  }

  const workspace = data.workspaces[workspaceIndex];
  const collectionIndex = (workspace.collections ?? []).findIndex((collection) => collection.id === options.collectionId);
  if (collectionIndex === -1) {
    throw new Error("Collection not found");
  }

  const collection = workspace.collections![collectionIndex];
  const environment: Environment = {
    id: data.meta.nextEnvironmentId,
    collection_id: collection.id,
    name: options.name,
    region: options.region ?? null,
    description: options.description ?? null,
    settings: options.settings ?? null,
    created_at: new Date().toISOString(),
  };

  data.meta.nextEnvironmentId += 1;
  const updatedCollection = {
    ...collection,
    environments: [...(collection.environments ?? []), environment],
  };

  const updatedCollections = [...(workspace.collections ?? [])];
  updatedCollections[collectionIndex] = updatedCollection;
  const updatedWorkspace = {
    ...workspace,
    collections: updatedCollections,
    updated_at: new Date().toISOString(),
  };

  data.workspaces = data.workspaces.map((value, index) =>
    index === workspaceIndex ? updatedWorkspace : value,
  );

  await writeGuestData(data);
  return environment;
};
