import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { clearNetworkLogs, subscribeNetworkLogs, type NetworkLog } from "../../services/networkLogs";
import UpgradePrompt from "../../components/UpgradePrompt";

const METHOD_FILTERS = ["ALL", "GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

const formatTimestamp = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString(undefined, { hour12: false });

const logMatchesSearch = (log: NetworkLog, search: string) => {
  if (!search) return true;
  const normalizedSearch = search.toLowerCase();
  return (
    log.originalUrl.toLowerCase().includes(normalizedSearch) ||
    (log.response ?? "").toLowerCase().includes(normalizedSearch)
  );
};

const NetworkInspectorScreen = () => {
  const { user } = useAuth();
  const isPaidUser = Boolean(user?.is_premium);
  const [logs, setLogs] = useState<NetworkLog[]>([]);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState(METHOD_FILTERS[0]);
  const [activeLogId, setActiveLogId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeNetworkLogs((next) => setLogs(next));
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!activeLogId && logs.length > 0) {
      setActiveLogId(logs[0].id);
    }
  }, [logs, activeLogId]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (methodFilter !== "ALL" && log.method !== methodFilter) {
        return false;
      }
      return logMatchesSearch(log, search);
    });
  }, [logs, methodFilter, search]);

  const activeLog = filteredLogs.find((log) => log.id === activeLogId) ?? filteredLogs[0] ?? null;

  const handleClearLogs = () => {
    clearNetworkLogs();
    setActiveLogId(null);
  };

  if (!isPaidUser) {
    return (
      <UpgradePrompt
        title="Network inspector locked"
        description="Network telemetry and proxying are only available on paid plans."
        actionCopy="Unlock inspector"
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <p className="text-[11px] uppercase tracking-[0.4em] text-[var(--muted)]">Network</p>
        <h1 className="text-3xl font-black text-on-surface">Network inspector</h1>
        <p className="text-sm text-on-surface-variant">
          Capture every request, inspect the headers and responses, and stream everything through the local proxy.
        </p>
      </header>
      <div className="flex flex-1 gap-6 overflow-hidden">
        <section className="flex w-[360px] flex-col gap-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Requests</p>
            <button
              type="button"
              onClick={handleClearLogs}
              className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary hover:text-primary/80"
            >
              Clear logs
            </button>
          </div>
          <div className="flex gap-2">
            <select
              className="flex-1 rounded-lg border border-outline-variant/40 bg-[var(--surface)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text)]"
              value={methodFilter}
              onChange={(event) => setMethodFilter(event.target.value)}
            >
              {METHOD_FILTERS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            <input
              type="search"
              placeholder="Search url or response"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="flex-1 rounded-lg border border-outline-variant/40 bg-[var(--surface)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text)] placeholder:text-on-surface-variant focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            />
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredLogs.length === 0 && (
              <p className="text-xs text-on-surface-variant">No logs yet. Send a request to get started.</p>
            )}
            {filteredLogs.map((log) => {
              const isActive = log.id === activeLog?.id;
              return (
                <button
                  type="button"
                  key={log.id}
                  onClick={() => setActiveLogId(log.id)}
                  className={`flex w-full flex-col gap-1 rounded-xl border px-3 py-2 text-left transition-all ${
                    isActive ? "border-primary bg-primary/[0.07]" : "border-transparent hover:border-outline-variant/40"
                  }`}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
                    {log.method} · {formatTimestamp(log.timestamp)}
                  </span>
                  <p className="text-sm font-mono text-on-surface">{log.originalUrl}</p>
                  <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em]">
                    <span className="text-success">{log.status ?? "—"}</span>
                    <span className="text-on-surface-variant">{log.duration} ms</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
        <section className="flex flex-1 flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          {!activeLog ? (
            <p className="text-sm text-on-surface-variant">
              No log selected. Send a request to see the network trace.
            </p>
          ) : (
            <div className="flex flex-col gap-4 overflow-hidden">
              <div className="flex flex-wrap items-center gap-4">
                <span className="rounded-full border border-outline-variant/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em]">
                  {activeLog.method}
                </span>
                <p className="text-sm text-on-surface-variant">{formatTimestamp(activeLog.timestamp)}</p>
                <p className="text-sm text-success">{activeLog.status ?? "Pending"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">Original URL</p>
                <p className="text-sm font-mono">{activeLog.originalUrl}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">Proxy URL</p>
                <p className="text-sm font-mono">{activeLog.proxyUrl}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">Request headers</p>
                  <ul className="max-h-32 overflow-auto text-[13px] font-mono text-on-surface-variant">
                    {Object.entries(activeLog.headers).map(([key, value]) => (
                      <li key={key}>
                        <span className="font-semibold text-on-surface">{key}: </span>
                        {value}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">Request body</p>
                  <pre className="max-h-32 overflow-auto rounded-lg border border-outline-variant/30 bg-[var(--surface)] p-3 text-[13px] font-mono text-on-surface">
                    {activeLog.body || "—"}
                  </pre>
                </div>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">Response</p>
                <pre className="max-h-48 overflow-auto rounded-lg border border-outline-variant/30 bg-[var(--surface)] p-3 text-[13px] font-mono text-on-surface">
                  {activeLog.response || "—"}
                </pre>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default NetworkInspectorScreen;
