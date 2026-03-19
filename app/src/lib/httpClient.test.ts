import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendRequest } from "./httpClient";

const tauriFetchMock = vi.fn();

vi.mock("@tauri-apps/plugin-http", () => ({
  fetch: tauriFetchMock,
}));

describe("sendRequest", () => {
  const originalWindow = (globalThis as any).window;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    tauriFetchMock.mockReset();
    (globalThis as any).window = originalWindow;
    globalThis.fetch = originalFetch;
  });

  it("falls back to browser fetch when Tauri isn't present", async () => {
    (globalThis as any).window = undefined;
    const browserFetch = vi.fn().mockResolvedValue({} as Response);
    globalThis.fetch = browserFetch;

    await sendRequest({
      url: "https://example.com",
      method: "GET",
      headers: { "Content-Type": "application/json" },
      bodyType: "none",
    });

    expect(browserFetch).toHaveBeenCalledOnce();
    expect(tauriFetchMock).not.toHaveBeenCalled();
  });

  it("uses Tauri fetch when __TAURI__ exists", async () => {
    (globalThis as any).window = { __TAURI__: {} };
    tauriFetchMock.mockResolvedValue({} as Response);

    await sendRequest({
      url: "https://example.com",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      bodyType: "none",
    });

    expect(tauriFetchMock).toHaveBeenCalledOnce();
  });

  it("parses JSON body correctly before sending", async () => {
    (globalThis as any).window = { __TAURI__: {} };
    tauriFetchMock.mockResolvedValue({} as Response);

    await sendRequest({
      url: "https://example.com",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      bodyType: "json",
      body: JSON.stringify({ identifier: "henk", password: "henk" }),
    });

    expect(tauriFetchMock).toHaveBeenCalledWith("https://example.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { type: "Json", payload: { identifier: "henk", password: "henk" } },
    });
  });

  it("throws when JSON is invalid", async () => {
    (globalThis as any).window = { __TAURI__: {} };

    await expect(
      sendRequest({
        url: "https://example.com",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        bodyType: "json",
        body: "{ invalid",
      }),
    ).rejects.toThrow("Invalid JSON body");
  });
});
