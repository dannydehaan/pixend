import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { clearNetworkLogs, subscribeNetworkLogs, type NetworkLog } from "../../services/networkLogs";
import UpgradePrompt from "../../components/UpgradePrompt";
import {
  applyNetworkProfile,
  getNetworkProfile,
  listNetworkPresets,
  type NetworkPreset,
  type NetworkProfile,
} from "../../services/networkLimiter";
import {
  cancelSpeedtest,
  runSpeedtest,
  subscribeSpeedtest,
  type EventPayloads,
} from "../../services/speedtest";

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
  const [presets, setPresets] = useState<NetworkPreset[]>([]);
  const [activeProfile, setActiveProfile] = useState<NetworkProfile | null>(null);
  const [isLimiterLoading, setIsLimiterLoading] = useState(true);
  const [limiterError, setLimiterError] = useState<string | null>(null);
  const [applyingPresetId, setApplyingPresetId] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [customDownload, setCustomDownload] = useState("0");
  const [customUpload, setCustomUpload] = useState("0");
  const [customLatency, setCustomLatency] = useState("0");
  const [customError, setCustomError] = useState<string | null>(null);
  const [isSavingCustom, setIsSavingCustom] = useState(false);
  const [speedtestStatus, setSpeedtestStatus] = useState<"idle" | "running" | "completed" | "cancelled" | "failed">("idle");
  const [speedtestPhase, setSpeedtestPhase] = useState<string | null>(null);
  const [speedtestProgress, setSpeedtestProgress] = useState<number | null>(null);
  const [speedtestPing, setSpeedtestPing] = useState<number | null>(null);
  const [speedtestDownload, setSpeedtestDownload] = useState<number | null>(null);
  const [speedtestUpload, setSpeedtestUpload] = useState<number | null>(null);
  const [speedtestError, setSpeedtestError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeNetworkLogs((next) => setLogs(next));
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!activeLogId && logs.length > 0) {
      setActiveLogId(logs[0].id);
    }
  }, [logs, activeLogId]);

  useEffect(() => {
    let isMounted = true;
    const loadLimiterData = async () => {
      try {
        const [presetList, profile] = await Promise.all([listNetworkPresets(), getNetworkProfile()]);
        if (!isMounted) return;
        setPresets(presetList);
        setActiveProfile(profile);
        setSelectedPresetId(profile.preset_id);
        if (profile.preset_id === "custom") {
          setCustomDownload(profile.download_kbps.toString());
          setCustomUpload(profile.upload_kbps.toString());
          setCustomLatency(profile.latency_ms.toString());
        }
      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : "Unable to load network limiter settings.";
        setLimiterError(message);
      } finally {
        if (isMounted) {
          setIsLimiterLoading(false);
        }
      }
    };
    loadLimiterData();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const cancel = subscribeSpeedtest("speedtest-started", () => {
      setSpeedtestStatus("running");
      setSpeedtestPhase("ping");
      setSpeedtestProgress(null);
      setSpeedtestError(null);
    });
    const cancelPing = subscribeSpeedtest("speedtest-ping", (payload) => {
      setSpeedtestPing(payload.latency_ms);
    });
    const cancelDownload = subscribeSpeedtest("speedtest-download", (payload) => {
      setSpeedtestPhase(payload.phase);
      setSpeedtestProgress(payload.progress);
      setSpeedtestDownload(payload.kbps);
    });
    const cancelUpload = subscribeSpeedtest("speedtest-upload", (payload) => {
      setSpeedtestPhase(payload.phase);
      setSpeedtestProgress(payload.progress);
      setSpeedtestUpload(payload.kbps);
    });
    const cancelCompleted = subscribeSpeedtest("speedtest-completed", (payload) => {
      setSpeedtestStatus("completed");
      setSpeedtestPing(payload.latency_ms);
      setSpeedtestDownload(payload.download_kbps);
      setSpeedtestUpload(payload.upload_kbps);
      setSpeedtestProgress(1);
      setSpeedtestPhase(null);
    });
    const cancelCancelled = subscribeSpeedtest("speedtest-cancelled", () => {
      setSpeedtestStatus("cancelled");
      setSpeedtestPhase(null);
      setSpeedtestProgress(null);
    });
    const cancelFailed = subscribeSpeedtest("speedtest-failed", (payload) => {
      setSpeedtestStatus("failed");
      setSpeedtestError(payload.error);
      setSpeedtestPhase(null);
      setSpeedtestProgress(null);
    });
    return () => {
      cancel();
      cancelPing();
      cancelDownload();
      cancelUpload();
      cancelCompleted();
      cancelCancelled();
      cancelFailed();
    };
  }, []);

  useEffect(() => {
    if (activeProfile && activeProfile.preset_id !== "custom") {
      setSelectedPresetId(activeProfile.preset_id);
    }
  }, [activeProfile]);

  useEffect(() => {
    if (activeProfile?.preset_id === "custom") {
      setCustomDownload(activeProfile.download_kbps.toString());
      setCustomUpload(activeProfile.upload_kbps.toString());
      setCustomLatency(activeProfile.latency_ms.toString());
    }
  }, [activeProfile]);

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

  const handlePresetSelect = async (preset: NetworkPreset) => {
    setSelectedPresetId(preset.preset_id);
    if (preset.preset_id === "custom") {
      setCustomError(null);
      if (activeProfile?.preset_id === "custom") {
        setCustomDownload(activeProfile.download_kbps.toString());
        setCustomUpload(activeProfile.upload_kbps.toString());
        setCustomLatency(activeProfile.latency_ms.toString());
      }
      return;
    }
    setLimiterError(null);
    setApplyingPresetId(preset.preset_id);
    try {
      const updatedProfile = await applyNetworkProfile({
        preset_id: preset.preset_id,
        label: preset.label,
        enabled: preset.enabled,
        download_kbps: preset.download_kbps,
        upload_kbps: preset.upload_kbps,
        latency_ms: preset.latency_ms,
      });
      setActiveProfile(updatedProfile);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to apply the selected preset.";
      setLimiterError(message);
    } finally {
      setApplyingPresetId(null);
    }
  };

  const handleCustomSave = async () => {
    setCustomError(null);
    setLimiterError(null);
    const parsedDownload = Number(customDownload);
    const parsedUpload = Number(customUpload);
    const parsedLatency = Number(customLatency);

    if (!parsedDownload || parsedDownload <= 0) {
      setCustomError("Download limit must be greater than zero.");
      return;
    }
    if (!parsedUpload || parsedUpload <= 0) {
      setCustomError("Upload limit must be greater than zero.");
      return;
    }
    if (Number.isNaN(parsedLatency) || parsedLatency < 0) {
      setCustomError("Latency must be zero or positive.");
      return;
    }

    setIsSavingCustom(true);
    try {
      const updatedProfile = await applyNetworkProfile({
        preset_id: "custom",
        label: "Custom",
        enabled: true,
        download_kbps: parsedDownload,
        upload_kbps: parsedUpload,
        latency_ms: parsedLatency,
      });
      setActiveProfile(updatedProfile);
      setCustomError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to apply custom limits.";
      setCustomError(message);
    } finally {
      setIsSavingCustom(false);
    }
  };

  const handleRunSpeedtest = async () => {
    setSpeedtestError(null);
    try {
      await runSpeedtest();
    } catch (error) {
      setSpeedtestError(error instanceof Error ? error.message : "Failed to start speed test.");
    }
  };

  const handleCancelSpeedtest = async () => {
    try {
      await cancelSpeedtest();
    } catch (error) {
      setSpeedtestError(error instanceof Error ? error.message : "Failed to cancel speed test.");
    }
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
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">Speed test</p>
            <p className="text-sm text-on-surface-variant">
              Measure latency, download, and upload throughput using the built-in runner.
            </p>
          </div>
          <div className="flex gap-2">
            {speedtestStatus === "running" ? (
              <button
                type="button"
                onClick={handleCancelSpeedtest}
                className="rounded-full border border-outline-variant/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-error hover:border-error"
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRunSpeedtest}
                className="rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-on-primary hover:bg-[var(--primary)]/90"
              >
                Run speed test
              </button>
            )}
          </div>
        </div>
        <div className="mt-4 grid gap-2 text-[12px] font-semibold uppercase tracking-[0.3em] text-on-surface-variant">
          <div className="flex items-center justify-between">
            <span>Status</span>
            <span>{speedtestStatus}</span>
          </div>
          {speedtestPhase && (
            <div className="flex items-center justify-between">
              <span>Phase</span>
              <span>{speedtestPhase}</span>
            </div>
          )}
          {speedtestProgress !== null && (
            <div className="flex items-center justify-between">
              <span>Progress</span>
              <span>{Math.round(speedtestProgress * 100)}%</span>
            </div>
          )}
          {speedtestPing && (
            <div className="flex items-center justify-between text-[11px] tracking-[0.2em]">
              <span>Latency</span>
              <span>{speedtestPing.toFixed(1)} ms</span>
            </div>
          )}
          {speedtestDownload && (
            <div className="flex items-center justify-between text-[11px] tracking-[0.2em]">
              <span>Download</span>
              <span>{speedtestDownload.toFixed(0)} KB/s</span>
            </div>
          )}
          {speedtestUpload && (
            <div className="flex items-center justify-between text-[11px] tracking-[0.2em]">
              <span>Upload</span>
              <span>{speedtestUpload.toFixed(0)} KB/s</span>
            </div>
          )}
          {speedtestError && <p className="text-xs text-red-500">{speedtestError}</p>}
        </div>
      </section>
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">Network limiter</p>
              <h2 className="text-2xl font-black text-on-surface">
                {isLimiterLoading ? "Loading..." : activeProfile?.label ?? "Unavailable"}
              </h2>
              <p className="text-sm text-on-surface-variant">
                {activeProfile ? (
                  activeProfile.enabled
                    ? `${activeProfile.download_kbps} KB/s ↓ · ${activeProfile.upload_kbps} KB/s ↑ · ${activeProfile.latency_ms} ms latency`
                    : "Throttling disabled · no limit"
                ) : (
                  "Active profile is not available yet."
                )}
              </p>
            </div>
            <span
              className={`text-xs font-semibold uppercase tracking-[0.4em] ${
                activeProfile?.enabled ? "text-[var(--primary)]" : "text-on-surface-variant"
              }`}
            >
              {activeProfile?.enabled ? "Limited" : "Unlimited"}
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant">
            Speeds are expressed in KB/s (kilobytes per second). Custom limits will be adjustable soon.
          </p>
          {limiterError && <p className="text-xs text-red-500">{limiterError}</p>}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          {isLimiterLoading && <p className="col-span-full text-xs text-on-surface-variant">Loading presets...</p>}
          {!isLimiterLoading &&
            presets.map((preset) => {
              const isActive = selectedPresetId === preset.preset_id;
              const isCustom = preset.preset_id === "custom";
              const isApplying = applyingPresetId === preset.preset_id;
              return (
                <button
                  key={preset.preset_id}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className={`flex flex-col gap-1 rounded-2xl border p-3 text-left text-[12px] font-semibold uppercase tracking-[0.3em] transition-all ${
                    isActive
                      ? "border-primary bg-primary/10 text-[var(--primary)]"
                      : "border-outline-variant/40 text-on-surface hover:border-[var(--text)]"
                  } ${isCustom ? "opacity-60 cursor-not-allowed" : "hover:bg-[var(--border)]/30"}`}
                >
                  <span>{preset.label}</span>
                  <span className="text-[10px] font-normal normal-case tracking-tight text-on-surface-variant">
                    {isCustom
                      ? "Custom limits"
                      : preset.enabled
                        ? `${preset.download_kbps} ↓ · ${preset.upload_kbps} ↑ · ${preset.latency_ms} ms`
                        : "No limit"}
                  </span>
                  {isApplying && <span className="text-[10px] text-[var(--primary)]">Applying…</span>}
                </button>
              );
            })}
        </div>
        {selectedPresetId === "custom" && (
          <div className="mt-4 rounded-2xl border border-outline-variant/40 bg-[var(--surface)] p-4 text-xs uppercase tracking-[0.3em] text-on-surface">
            <p className="text-[11px] text-on-surface-variant">Custom limits</p>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              <label className="flex flex-col gap-1 text-[12px] font-semibold tracking-[0.35em]">
                Download (KB/s)
                <input
                  type="number"
                  min={1}
                  value={customDownload}
                  onChange={(event) => setCustomDownload(event.target.value)}
                  className="rounded-lg border border-outline-variant/40 bg-[var(--surface)] px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.35em] text-on-surface"
                />
              </label>
              <label className="flex flex-col gap-1 text-[12px] font-semibold tracking-[0.35em]">
                Upload (KB/s)
                <input
                  type="number"
                  min={1}
                  value={customUpload}
                  onChange={(event) => setCustomUpload(event.target.value)}
                  className="rounded-lg border border-outline-variant/40 bg-[var(--surface)] px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.35em] text-on-surface"
                />
              </label>
              <label className="flex flex-col gap-1 text-[12px] font-semibold tracking-[0.35em]">
                Latency (ms)
                <input
                  type="number"
                  min={0}
                  value={customLatency}
                  onChange={(event) => setCustomLatency(event.target.value)}
                  className="rounded-lg border border-outline-variant/40 bg-[var(--surface)] px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.35em] text-on-surface"
                />
              </label>
            </div>
            {customError && <p className="mt-2 text-[11px] text-red-500">{customError}</p>}
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCustomSave}
                disabled={isSavingCustom}
                className="rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-on-primary hover:bg-[var(--primary)]/90 disabled:opacity-50"
              >
                {isSavingCustom ? "Saving…" : "Apply custom"}
              </button>
            </div>
          </div>
        )}
      </section>
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
