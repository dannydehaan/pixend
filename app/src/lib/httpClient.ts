const isTauriContext = () =>
  typeof window !== "undefined" && "__TAURI__" in window && Boolean((window as any).__TAURI__);

type SendRequestParams = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  bodyType?: "json" | "none";
  signal?: AbortSignal;
};

export type HttpClientResult = {
  response?: Response;
  duration: number;
  error?: Error;
};

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
  console.log("Mode:", isTauri ? "TAURI" : "BROWSER");

  try {
    const fetchResult = isTauri
      ? (await import("@tauri-apps/plugin-http")).fetch(url, {
          method,
          headers,
          body: hasJsonBody ? { type: "Json", payload: parsedBody } : undefined,
        })
      : await globalThis.fetch(url, {
          method,
          headers,
          body: hasJsonBody ? body : undefined,
          signal,
        });

    return {
      response: fetchResult,
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
