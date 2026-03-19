import { useMemo } from "react";
import type { ResponsePayload } from "./types";

type ResponseViewerProps = {
  response?: ResponsePayload;
  isLoading: boolean;
  errorMessage?: string | null;
};

const ResponseViewer = ({ response, isLoading, errorMessage }: ResponseViewerProps) => {
  const prettyBody = useMemo(() => {
    if (!response?.body) {
      return "";
    }

    try {
      const parsed = JSON.parse(response.body);
      return JSON.stringify(parsed, null, 2);
    } catch (err) {
      return response.body;
    }
  }, [response]);

  const headerEntries = useMemo(() => (response ? Object.entries(response.headers) : []), [response]);

  return (
    <section className="space-y-4 rounded-2xl border border-[#494454]/30 bg-surface-container-highest p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.4em] text-on-surface-variant">Response</h2>
          {isLoading && <p className="text-[11px] text-on-surface-variant">Sending request…</p>}
          {errorMessage && <p className="text-[11px] text-error font-semibold">{errorMessage}</p>}
        </div>
        <div className="flex flex-col items-end text-xs uppercase tracking-[0.35em] text-on-surface-variant">
          <span>{response ? `Status ${response.status}` : "Awaiting response"}</span>
          {response && (
            <span className="text-[10px] text-on-surface-variant">
              Time: {response.duration} ms
            </span>
          )}
        </div>
      </div>
      {response ? (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-[0.35em] text-on-surface-variant">Headers</p>
              <div className="rounded-2xl border border-outline-variant/30 bg-[#0b1326] p-3 text-xs text-on-surface-variant">
                {headerEntries.length ? (
                  <div className="space-y-1">
                    {headerEntries.map(([key, value]) => (
                      <div key={key} className="flex flex-col gap-0.5">
                        <span className="font-mono text-[11px] text-on-surface">{key}</span>
                        <span className="text-[11px] text-on-surface-variant">{value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-on-surface-variant">No headers returned.</p>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-[0.35em] text-on-surface-variant">Body</p>
              <div className="max-h-64 overflow-auto rounded-2xl border border-outline-variant/30 bg-[#0b1326] p-3 text-xs text-on-surface-variant">
                <pre className="whitespace-pre-wrap font-mono text-[11px] text-on-surface">
                  {prettyBody || "[empty response body]"}
                </pre>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-on-surface-variant">Send a request to inspect the response.</p>
      )}
    </section>
  );
};

export default ResponseViewer;
