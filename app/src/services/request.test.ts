import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { request, setApiBase } from "./api";

describe("request utility", () => {
  beforeEach(() => {
    setApiBase("https://test.pixend/api/1.0");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockHeaders = (contentType?: string) => ({
    get: (_: string) => contentType ?? null,
    forEach: (cb: (value: string, key: string) => void) => {
      if (contentType) {
        cb(contentType, "content-type");
      }
    },
  });

  const stubFetch = (method: string, body: string | null, headers = mockHeaders("application/json")) => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        headers,
        json: () => Promise.resolve({ response: body }),
        text: () => Promise.resolve(body ?? ""),
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  };

  it("performs a GET request without body", async () => {
    const fetchMock = stubFetch("GET", null);

    const result = await request<{ response?: string }>(
      "/test",
      { method: "GET" },
      { auth: false },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://test.pixend/api/1.0/test",
      expect.objectContaining({ method: "GET" }),
    );
    expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ response: null });
  });

  it("includes JSON body for POST/PUT/PATCH/DELETE when provided", async () => {
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      const payload = JSON.stringify({ method });
      const fetchMock = stubFetch(method, payload);

      const result = await request<{ response?: string }>(
        "/mutate",
        { method, body: payload },
        { auth: false },
      );

      expect(fetchMock).toHaveBeenCalledWith("https://test.pixend/api/1.0/mutate", expect.objectContaining({ method, body: payload }));
      expect(result.headers["content-type"]).toBe("application/json");
    }
  });

  it("handles HEAD with empty body", async () => {
    const headers = mockHeaders();
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 204,
        headers,
        json: () => Promise.resolve(null),
        text: () => Promise.resolve(""),
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await request<void>(
      "/status",
      { method: "HEAD" },
      { auth: false },
    );

    expect(fetchMock).toHaveBeenCalledWith("https://test.pixend/api/1.0/status", expect.objectContaining({ method: "HEAD" }));
    expect(result.body).toBeNull();
  });

  it("reads raw text for OPTIONS responses", async () => {
    const headers = {
      get: () => "text/plain",
      forEach: (cb: (value: string, key: string) => void) => cb("text/plain", "content-type"),
    };
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        headers,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve("option response"),
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await request<string>(
      "/options",
      { method: "OPTIONS" },
      { auth: false },
    );

    expect(result.body).toBe("option response");
  });
});
