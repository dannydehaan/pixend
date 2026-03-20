const isTauriContext = () =>
  typeof window !== "undefined" &&
  typeof (window as Window & { __TAURI_IPC__?: unknown }).__TAURI_IPC__ !== "undefined";

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
      const ipc = (window as Window & { __TAURI_IPC__?: { invoke: (arg: { cmd: string; payload?: unknown }) => Promise<unknown> } }).__TAURI_IPC__;
      if (!ipc) {
        throw new Error("Tauri IPC not available");
      }
      const payload = {
        url,
        method,
        headers,
        body: hasJsonBody ? body : undefined,
      };
      const response = (await ipc.invoke({ cmd: "send_network_request_command", payload })) as {
        status: number;
        headers: Record<string, string>;
        body: string;
        duration_ms: number;
      };
      return {
        response: {
          status: response.status,
          headers: response.headers,
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

    return {
      response: {
        status: fetchResult.status,
        headers: Object.fromEntries(fetchResult.headers.entries()),
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
