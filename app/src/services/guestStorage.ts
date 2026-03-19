import { Store } from "@tauri-apps/plugin-store";
import { Collection, Environment, Workspace, WorkspaceType } from "./api";

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
  nextCollectionId: number;
  nextEnvironmentId: number;
};

type GuestPayload = {
  workspace: Workspace;
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
  nextCollectionId: 1,
  nextEnvironmentId: 1,
};

const ensureCollections = (collections: Collection[] | undefined): Collection[] =>
  (collections ?? []).map((collection) => ({
    ...collection,
    environments: collection.environments ?? [],
  }));

const createWorkspaceSnapshot = (workspace: Workspace): Workspace => ({
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
  const workspace = createWorkspaceSnapshot(payload?.workspace ?? defaultWorkspace);
  const meta = payload?.meta ?? defaultMeta;

  return {
    workspace,
    meta: {
      nextCollectionId: Math.max(meta.nextCollectionId, 1),
      nextEnvironmentId: Math.max(meta.nextEnvironmentId, 1),
    },
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

export const loadGuestWorkspace = async (): Promise<Workspace> => {
  const data = await readGuestData();
  return data.workspace;
};

export const addGuestCollection = async (options: {
  workspaceId: number;
  name: string;
  description?: string;
}): Promise<Collection> => {
  const data = await readGuestData();
  if (data.workspace.id !== options.workspaceId) {
    throw new Error("Workspace does not match guest workspace");
  }

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
  data.workspace.collections = [...(data.workspace.collections ?? []), collection];
  data.workspace.updated_at = new Date().toISOString();

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
  const collection = (data.workspace.collections ?? []).find((item) => item.id === options.collectionId);

  if (!collection) {
    throw new Error("Collection not found");
  }

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
  collection.environments = [...(collection.environments ?? []), environment];
  data.workspace.updated_at = new Date().toISOString();

  await writeGuestData(data);
  return environment;
};
