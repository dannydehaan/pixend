const getTauriWindow = () => (window as Window & { __TAURI__?: { invoke: (args: { cmd: string; payload?: unknown }) => Promise<unknown> } }).__TAURI__;
const isTauriContext = () => typeof window !== "undefined" && typeof getTauriWindow() !== "undefined";

type SendRequestParams = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  bodyType?: "json" | "none";
  signal?: AbortSignal;
};

export type HttpClientResponse = {
  status: number;
  headers: Record<string, string>;
  body: string;
};

export type HttpClientResult = {
  response?: HttpClientResponse;
  duration: number;
  error?: Error;
};

/**
 * sendRequest uses the Rust `send_network_request_command` when running inside Tauri so the active profile throttles bytes in KB/s.
 * The browser fallback still uses `fetch` and therefore bypasses the limiter (browser mode cannot reach the Rust bridge).
 */
export async function sendRequest({
  url,
  method,
  headers,
  body,
  bodyType = "none",
  signal,
}: SendRequestParams): Promise<HttpClientResult> {
  const start = performance.now();
  const hasJsonBody = bodyType === "json" && typeof body === "string" && body.trim().length > 0;
  let parsedBody: unknown;
  if (hasJsonBody) {
    try {
      parsedBody = JSON.parse(body as string);
    } catch {
      throw new Error("Invalid JSON body");
    }
  }

  const isTauri = isTauriContext();
  if (isTauri) {
    try {
      const tauriWindow = getTauriWindow();
      if (!tauriWindow) {
        throw new Error("Tauri IPC not available");
      }
      const payload = { url, method, headers, body: hasJsonBody ? body : undefined };
      const response = (await tauriWindow.invoke({ cmd: "send_network_request_command", payload })) as {
        status: number;
        headers: Record<string, string>;
        body: string;
        duration_ms: number;
      };
      const normalizedHeaders: Record<string, string> = {};
      Object.entries(response.headers).forEach(([key, value]) => {
        normalizedHeaders[key.toLowerCase()] = value;
      });
      return {
        response: {
          status: response.status,
          headers: normalizedHeaders,
          body: response.body,
        },
        duration: response.duration_ms,
      };
    } catch (error) {
      if (signal?.aborted) {
        return { duration: Math.round(performance.now() - start) };
      }
      let message = "Request failed.";
      if (!isTauri) {
        message =
          "Request failed. This may be caused by CORS restrictions in browser mode. Try running the app with Tauri (`npm run tauri dev`).";
      }
      if (error instanceof Error && error.name === "AbortError") {
        return { duration: Math.round(performance.now() - start) };
      }
      return {
        duration: Math.round(performance.now() - start),
        error: new Error(message),
      };
    }
  }

  console.log("Mode:", "BROWSER");
  try {
    const fetchResult = await globalThis.fetch(url, {
      method,
      headers,
      body: hasJsonBody ? body : undefined,
      signal,
    });

    const headers = Object.fromEntries(fetchResult.headers.entries());
    const normalized: Record<string, string> = {};
    Object.entries(headers).forEach(([key, value]) => {
      normalized[key.toLowerCase()] = value;
    });
    return {
      response: {
        status: fetchResult.status,
        headers: normalized,
        body: await fetchResult.text(),
      },
      duration: Math.round(performance.now() - start),
    };
  } catch (error) {
    if (signal?.aborted) {
      return { duration: Math.round(performance.now() - start) };
    }
    let message = "Request failed.";
    if (!isTauri) {
      message =
        "Request failed. This may be caused by CORS restrictions in browser mode. Try running the app with Tauri (`npm run tauri dev`).";
    }
    if (error instanceof Error && error.name === "AbortError") {
      return { duration: Math.round(performance.now() - start) };
    }
    return {
      duration: Math.round(performance.now() - start),
      error: new Error(message),
    };
  }
}
