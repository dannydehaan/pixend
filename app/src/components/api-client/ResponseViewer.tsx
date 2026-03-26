import { useEffect, useMemo, useState } from "react";
import type { ResponsePayload } from "./types";

type ResponseViewerProps = {
  response?: ResponsePayload;
  isLoading: boolean;
  errorMessage?: string | null;
};

type Tab = "body" | "headers" | "cookies";

const tabConfig: Record<Tab, { label: string }> = {
  body: { label: "Body" },
  headers: { label: "Headers" },
  cookies: { label: "Cookies" },
};

const ResponseViewer = ({ response, isLoading, errorMessage }: ResponseViewerProps) => {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [activeTab, setActiveTab] = useState<Tab>("body");

  const parsedJson = useMemo(() => {
    if (!response?.body) {
      return null;
    }

    try {
      return JSON.parse(response.body);
    } catch (err) {
      return null;
    }
  }, [response?.body]);

  const prettyBody = useMemo(() => {
    if (parsedJson) {
      return JSON.stringify(parsedJson, null, 2);
    }
    return response?.body ?? "";
  }, [parsedJson, response?.body]);

  const responseBody = response?.body ?? "";
  const headerEntries = useMemo(() => (response ? Object.entries(response.headers) : []), [response]);
  const cookieEntries = useMemo(
    () =>
      headerEntries
        .filter(([key]) => key.toLowerCase() === "set-cookie")
        .flatMap(([, value]) => value.split(/\r?\n|,\s*/).filter(Boolean)),
    [headerEntries],
  );
  const bodySizeBytes = response ? new TextEncoder().encode(response.body ?? "").length : 0;

  useEffect(() => {
    setCopyStatus("idle");
  }, [responseBody]);

  useEffect(() => {
    if (copyStatus === "copied") {
      const timeout = setTimeout(() => setCopyStatus("idle"), 1500);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [copyStatus]);

  const copyText = async () => {
    if (!response) {
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(responseBody);
        setCopyStatus("copied");
        return;
      }
      throw new Error("Clipboard not available");
    } catch {
      setCopyStatus("idle");
    }
  };

  const displayValue = prettyBody || "[empty response body]";

  return (
    <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--muted)]">Response</h2>
          {isLoading && <p className="text-[11px] text-[var(--muted)]">Sending request…</p>}
          {errorMessage && <p className="text-[11px] text-error font-semibold">{errorMessage}</p>}
        </div>
        <div className="flex flex-col items-end text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
          <span>{response ? `Status ${response.status}` : "Awaiting response"}</span>
          {response && (
            <span className="text-[10px] text-[var(--muted)]">Time: {response.duration} ms</span>
          )}
          {response && (
            <span className="text-[10px] text-[var(--muted)]">Size: {bodySizeBytes} bytes</span>
          )}
        </div>
      </div>
      {response ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.35em]">
            {(Object.entries(tabConfig) as [Tab, { label: string }][]).map(([key, { label }]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`rounded-full px-3 py-1 transition ${
                  activeTab === key
                    ? "border border-primary bg-primary/10 text-primary"
                    : "border border-outline-variant/40 text-on-surface-variant"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-3 text-xs text-[var(--text)]">
            {activeTab === "body" && (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-on-surface-variant">Body</p>
                  <button
                    type="button"
                    onClick={copyText}
                    disabled={!response || isLoading}
                    className="whitespace-nowrap rounded-full border border-outline-variant/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-on-surface-variant transition hover:border-primary hover:text-primary disabled:border-outline-variant/20 disabled:text-on-surface-variant/60"
                  >
                    {copyStatus === "copied" ? "Copied" : "Copy body"}
                  </button>
                </div>
                <div className="max-h-64 overflow-auto">
                  <textarea
                    readOnly
                    value={displayValue}
                    className="response-body h-full w-full resize-none bg-transparent font-mono text-[11px] leading-relaxed focus:outline-none"
                    rows={10}
                  />
                </div>
              </div>
            )}
            {activeTab === "headers" && (
              <div className="space-y-1">
                {headerEntries.length ? (
                  headerEntries.map(([key, value]) => (
                    <div key={key} className="flex flex-col gap-0.5">
                      <span className="font-mono text-[11px] text-on-surface">{key}</span>
                      <span className="text-[11px] text-on-surface-variant">{value}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-on-surface-variant">No headers returned.</p>
                )}
              </div>
            )}
            {activeTab === "cookies" && (
              <div className="space-y-1">
                {cookieEntries.length ? (
                  cookieEntries.map((cookie, index) => (
                    <div key={`${cookie}-${index}`} className="flex flex-col gap-0.5">
                      <span className="font-mono text-[11px] text-on-surface">{cookie}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-on-surface-variant">No cookies returned.</p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-on-surface-variant">Send a request to inspect the response.</p>
      )}
    </section>
  );
};

export default ResponseViewer;
