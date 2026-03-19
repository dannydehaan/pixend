import { afterEach, describe, expect, it, vi } from "vitest";

declare global {
  var __STORE_MOCK: Record<string, any>;
  var __LOAD_MOCK: ReturnType<typeof vi.fn>;
  var __GET_MOCK: ReturnType<typeof vi.fn>;
}

vi.mock("@tauri-apps/plugin-store", () => {
  const storeMock = {
    get: vi.fn(() => Promise.resolve(null)),
    set: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
    save: vi.fn(() => Promise.resolve()),
  };
  const loadMock = vi.fn(() => Promise.resolve(storeMock));
  const getMock = vi.fn(() => Promise.resolve(null));

  globalThis.__STORE_MOCK = storeMock;
  globalThis.__LOAD_MOCK = loadMock;
  globalThis.__GET_MOCK = getMock;

  return {
    Store: {
      load: loadMock,
      get: getMock,
    },
  };
});

import { apiClient, clearToken, getToken, setApiBase, setToken } from "./api";

const storeMock = globalThis.__STORE_MOCK;
const loadMock = globalThis.__LOAD_MOCK;
const getMock = globalThis.__GET_MOCK;

setApiBase("https://test.pixend/api/1.0");

const ensureTauri = () => {
  if (!Object.prototype.hasOwnProperty.call(window, "__TAURI_IPC__")) {
    Object.defineProperty(window, "__TAURI_IPC__", {
      value: {},
      configurable: true,
    });
  }
};

const cleanupTauri = () => {
  if (Object.prototype.hasOwnProperty.call(window, "__TAURI_IPC__")) {
    delete (window as Window & { __TAURI_IPC__?: unknown }).__TAURI_IPC__;
  }
};

const mockFetchSuccess = (data: unknown) =>
  vi.fn(() =>
    Promise.resolve({
      ok: true,
      headers: { get: () => "application/json" },
      json: () => Promise.resolve(data),
    }),
  );

afterEach(() => {
  vi.restoreAllMocks();
  cleanupTauri();
  window.localStorage.clear();
});

describe("token storage with plugin", () => {
  it("persists, retrieves, and clears tokens", async () => {
    ensureTauri();
    const tokenValue = "token-123";

    await setToken(tokenValue);

    expect(loadMock).toHaveBeenCalled();
    expect(storeMock.set).toHaveBeenCalledWith("pixend_token", tokenValue);
    expect(window.localStorage.getItem("pixend_token")).toBe(tokenValue);

    storeMock.get.mockResolvedValueOnce(tokenValue);

    const fetched = await getToken();
    expect(fetched).toBe(tokenValue);

    await clearToken();
    expect(storeMock.delete).toHaveBeenCalledWith("pixend_token");
    expect(window.localStorage.getItem("pixend_token")).toBeNull();
  });

  it("falls back safely when loading the plugin fails", async () => {
    ensureTauri();
    loadMock.mockRejectedValueOnce(new Error("oops"));

    await expect(setToken("retry")).resolves.toBeUndefined();

    expect(window.localStorage.getItem("pixend_token")).toBe("retry");
  });
});

describe("apiClient headers", () => {
  it("attaches Authorization header when token is stored", async () => {
    ensureTauri();
    storeMock.get.mockResolvedValueOnce("super-secret");

    const fetchMock = mockFetchSuccess({ data: [] });
    vi.stubGlobal("fetch", fetchMock);

    await apiClient.fetchWorkspaces();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/workspaces"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer super-secret",
          Accept: "application/json",
        }),
      }),
    );
  });

  it("always sends Accept application/json", async () => {
    storeMock.get.mockResolvedValueOnce("token-123");
    ensureTauri();

    const fetchMock = mockFetchSuccess({ data: [] });
    vi.stubGlobal("fetch", fetchMock);

    await apiClient.fetchWorkspaces();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/workspaces"),
      expect.objectContaining({
        headers: expect.objectContaining({ Accept: "application/json" }),
      }),
    );
  });

  it("fails fast when there is no stored token", async () => {
    ensureTauri();
    storeMock.get.mockResolvedValueOnce(null);

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiClient.fetchWorkspaces()).rejects.toThrow("Missing authentication token");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
