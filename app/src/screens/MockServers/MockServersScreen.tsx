import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  MockServer,
  CreateMockServerPayload,
  MockServerRequest,
  clearMockServerRequests,
  createMockServer,
  deleteMockServer,
  fetchMockServerRequests,
  fetchMockServers,
  listRunningMockServers,
  startMockServer,
  stopMockServer,
} from "../../services/mockServerService";

const areHeadersEqual = (
  previous: Record<string, string>,
  next: Record<string, string>
): boolean => {
  const previousKeys = Object.keys(previous);
  if (previousKeys.length !== Object.keys(next).length) {
    return false;
  }
  return previousKeys.every((key) => previous[key] === next[key]);
};

const areRequestsEqual = (previous: MockServerRequest, next: MockServerRequest): boolean => {
  if (previous.method !== next.method) {
    return false;
  }
  if (previous.path !== next.path) {
    return false;
  }
  if (previous.body !== next.body) {
    return false;
  }
  if (previous.timestamp !== next.timestamp) {
    return false;
  }
  return areHeadersEqual(previous.headers, next.headers);
};

const mergeRequestCollections = (
  incoming: MockServerRequest[],
  existing: MockServerRequest[]
): { merged: MockServerRequest[]; reset: boolean } => {
  if (!incoming.length) {
    return { merged: [], reset: existing.length > 0 };
  }

  if (!existing.length) {
    return { merged: incoming, reset: false };
  }

  if (incoming.length < existing.length) {
    return { merged: incoming, reset: true };
  }

  const incomingIds = new Set(incoming.map((request) => request.id));
  if (existing.some((request) => !incomingIds.has(request.id))) {
    return { merged: incoming, reset: true };
  }

  const existingById = new Map(existing.map((request) => [request.id, request]));
  const newEntries: MockServerRequest[] = [];
  let hasChanges = false;

  for (const request of incoming) {
    const previousRequest = existingById.get(request.id);
    if (!previousRequest) {
      newEntries.push(request);
      hasChanges = true;
      continue;
    }

    if (!areRequestsEqual(previousRequest, request)) {
      existingById.set(request.id, { ...previousRequest, ...request });
      hasChanges = true;
    }
  }

  if (!hasChanges) {
    return { merged: existing, reset: false };
  }

  const orderedExisting = existing.map((request) => existingById.get(request.id) ?? request);
  return { merged: [...newEntries, ...orderedExisting], reset: false };
};

const getRequestKey = (request: MockServerRequest) => request.id;

type FormState = {
  name: string;
  port: string;
};

export const MockServersScreen = () => {
  const { user } = useAuth();
  const isPaidUser = Boolean(user?.is_premium);
  const [servers, setServers] = useState<MockServer[]>([]);
  const [runningPorts, setRunningPorts] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [busyPorts, setBusyPorts] = useState<Set<number>>(new Set());
  const [form, setForm] = useState<FormState>({ name: "", port: "" });
  const [error, setError] = useState<string | null>(null);
  const [selectedPort, setSelectedPort] = useState<number | null>(null);
  const [mockRequests, setMockRequests] = useState<MockServerRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [openRequestKeys, setOpenRequestKeys] = useState<Set<string>>(new Set());

  const toggleRequestKey = (key: string) => {
    setOpenRequestKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const readRunningPorts = async () => {
    try {
      const running = await listRunningMockServers();
      setRunningPorts(new Set(running));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to fetch running servers";
      setError(message);
    }
  };

  const loadServers = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMockServers();
      setServers(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load mock servers";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await Promise.all([loadServers(), readRunningPorts()]);
  };

  useEffect(() => {
    refresh();
  }, []);

  const loadRequestsForPort = async (port: number) => {
    setRequestsLoading(true);
    setRequestsError(null);
    try {
      const result = await fetchMockServerRequests(port);
      let shouldReset = false;
      setMockRequests((prev) => {
        const { merged, reset } = mergeRequestCollections(result, prev);
        shouldReset = reset;
        return merged;
      });
      if (shouldReset) {
        setOpenRequestKeys(new Set());
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load mock server requests";
      setRequestsError(message);
      setMockRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleClearRequests = async () => {
    if (!selectedPort) return;
    setRequestsLoading(true);
    setRequestsError(null);
    try {
      await clearMockServerRequests(selectedPort);
      setMockRequests([]);
      setOpenRequestKeys(new Set());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to clear mock requests";
      setRequestsError(message);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleSelectServer = (server: MockServer) => {
    const alreadySelected = selectedPort === server.port;
    if (alreadySelected) {
      setSelectedPort(null);
      setMockRequests([]);
      setRequestsError(null);
      return;
    }
    setSelectedPort(server.port);
    void loadRequestsForPort(server.port);
  };

  useEffect(() => {
    if (selectedPort !== null && !servers.some((server) => server.port === selectedPort)) {
      setSelectedPort(null);
      setMockRequests([]);
      setRequestsError(null);
    }
  }, [servers, selectedPort]);

  useEffect(() => {
    if (!selectedPort) {
      setOpenRequestKeys(new Set());
      return;
    }

    const interval = setInterval(() => void loadRequestsForPort(selectedPort), 2000);
    return () => clearInterval(interval);
  }, [selectedPort]);

  const formatHeaderLines = (headers: Record<string, string>) => {
    const entries = Object.entries(headers).sort(([a], [b]) => a.localeCompare(b));
    if (!entries.length) {
      return "—";
    }
    return entries.map(([key, value]) => `${key}: ${value}`).join("\n");
  };

  const selectedServerName = servers.find((server) => server.port === selectedPort)?.name;

  const handleCreateServer = async () => {
    if (!isPaidUser) {
      return;
    }

    const port = Number(form.port);
    if (!form.name.trim() || Number.isNaN(port)) {
      setError("Provide a name and valid port between 1024 and 65535.");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const payload: CreateMockServerPayload = { name: form.name.trim(), port };
      await createMockServer(payload);
      setForm({ name: "", port: "" });
      await loadServers();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create mock server";
      setError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const updateBusyPorts = (port: number, add: boolean) => {
    setBusyPorts((prev) => {
      const next = new Set(prev);
      if (add) {
        next.add(port);
      } else {
        next.delete(port);
      }
      return next;
    });
  };

  const handleStart = async (port: number) => {
    if (!isPaidUser) return;
    updateBusyPorts(port, true);
    setError(null);
    try {
      await startMockServer(port);
      await readRunningPorts();
    } catch (err) {
      const fallback = "Unable to start mock server";
      const message = err instanceof Error ? err.message : String(err ?? fallback);
      setError(message || fallback);
    } finally {
      updateBusyPorts(port, false);
    }
  };

  const handleStop = async (port: number) => {
    if (!isPaidUser) return;
    updateBusyPorts(port, true);
    setError(null);
    try {
      await stopMockServer(port);
      await readRunningPorts();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to stop mock server";
      setError(message);
    } finally {
      updateBusyPorts(port, false);
    }
  };

  const handleDelete = async (id: number, port: number) => {
    if (!isPaidUser) return;
    updateBusyPorts(port, true);
    setError(null);
    try {
      await deleteMockServer(id);
      if (selectedPort === port) {
        setSelectedPort(null);
        setMockRequests([]);
        setRequestsError(null);
      }
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete mock server";
      setError(message);
    } finally {
      updateBusyPorts(port, false);
    }
  };

  const statusLabel = (port: number) => (runningPorts.has(port) ? "Running" : "Stopped");

  const hasServers = servers.length > 0;
  const canInteract = isPaidUser;

  return (
    <div className="px-8 py-10 space-y-6 max-w-6xl mx-auto">
      <header className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.4em] text-primary">Runtime</p>
        <h1 className="text-3xl font-black">Mock Servers</h1>
        {!isPaidUser && (
          <p className="text-sm text-on-surface-variant">Mock servers are available for paid users only.</p>
        )}
      </header>

      <section className="space-y-3">
        <div className="flex flex-col gap-2">
          <div className="grid md:grid-cols-[2fr_1fr] gap-3">
            <input
              type="text"
              placeholder="Server name"
              value={form.name}
              disabled={!canInteract}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="px-4 py-3 rounded-lg bg-surface-container-high border border-border text-sm outline-none focus:border-primary"
            />
            <input
              type="number"
              placeholder="Port"
              min={1024}
              max={65535}
              value={form.port}
              disabled={!canInteract}
              onChange={(event) => setForm((prev) => ({ ...prev, port: event.target.value }))}
              className="px-4 py-3 rounded-lg bg-surface-container-high border border-border text-sm outline-none focus:border-primary"
            />
          </div>
          <button
            type="button"
            onClick={handleCreateServer}
            disabled={!canInteract || isCreating}
            className="px-5 py-3 rounded-lg text-sm font-semibold uppercase tracking-[0.3em] bg-gradient-to-r from-primary to-primary-container text-on-primary disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Create Mock Server
          </button>
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">My mock servers</h2>
          <button
            type="button"
            onClick={refresh}
            className="text-xs uppercase tracking-[0.3em] text-[var(--muted)] hover:text-on-surface"
          >
            Refresh
          </button>
        </div>
        {loading && <p className="text-sm text-on-surface-variant">Loading mock servers...</p>}
        {!loading && !hasServers && (
          <div className="p-4 rounded-lg border border-border text-sm text-on-surface-variant">
            You haven&apos;t created any mock servers yet.
          </div>
        )}
        {!loading && hasServers && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Port</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[var(--text)]">
                {servers.map((server) => {
                  const isRunning = runningPorts.has(server.port);
                  const isBusy = busyPorts.has(server.port);
                  return (
                    <tr
                      key={server.id}
                      onClick={() => handleSelectServer(server)}
                      className={`border-t border-border cursor-pointer ${
                        selectedPort === server.port ? "bg-surface-container-high" : ""
                      }`}
                    >
                      <td className="py-3 font-medium">{server.name}</td>
                      <td className="py-3">{server.port}</td>
                      <td className="py-3">{statusLabel(server.port)}</td>
                      <td className="py-3 text-right space-x-1">
                        <button
                          type="button"
                          disabled={!canInteract || isRunning || isBusy}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleStart(server.port);
                          }}
                          className="px-3 py-1 rounded bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-[0.3em] disabled:opacity-50"
                        >
                          Start
                        </button>
                        <button
                          type="button"
                          disabled={!canInteract || !isRunning || isBusy}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleStop(server.port);
                          }}
                          className="px-3 py-1 rounded bg-surface-container-high text-[10px] font-semibold uppercase tracking-[0.3em] disabled:opacity-50"
                        >
                          Stop
                        </button>
                        <button
                          type="button"
                          disabled={!canInteract || isBusy}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDelete(server.id, server.port);
                          }}
                          className="px-3 py-1 rounded bg-error/10 text-error text-[10px] font-semibold uppercase tracking-[0.3em] disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Incoming requests</h2>
            {selectedPort && (
              <p className="text-sm text-on-surface-variant">
                {selectedServerName ? `${selectedServerName} • ` : ""}Port {selectedPort}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!selectedPort || requestsLoading}
              onClick={() => selectedPort && void loadRequestsForPort(selectedPort)}
              className="text-xs uppercase tracking-[0.3em] text-[var(--muted)] hover:text-on-surface disabled:opacity-40"
            >
              Refresh
            </button>
            <button
              type="button"
              disabled={!selectedPort || requestsLoading}
              onClick={handleClearRequests}
              className="text-xs uppercase tracking-[0.3em] text-error hover:text-on-surface disabled:opacity-40"
            >
              Clear requests
            </button>
          </div>
        </div>
        {!selectedPort && (
          <p className="text-sm text-on-surface-variant">
            Select a mock server to inspect the incoming traffic.
          </p>
        )}
        {selectedPort && requestsLoading && (
          <p className="text-sm text-on-surface-variant">Loading requests...</p>
        )}
        {selectedPort && !requestsLoading && requestsError && (
          <p className="text-sm text-error">{requestsError}</p>
        )}
        {selectedPort && !requestsLoading && !requestsError && mockRequests.length === 0 && (
          <div className="p-4 rounded-lg border border-border text-sm text-on-surface-variant">
            No requests have been received yet.
          </div>
        )}
        {selectedPort && !requestsLoading && mockRequests.length > 0 && (
          <div className="space-y-3">
            {mockRequests.map((request) => {
              const requestKey = getRequestKey(request);
              const isOpen = openRequestKeys.has(requestKey);
              return (
                <div
                  key={requestKey}
                  className="p-4 rounded-lg border border-border bg-surface-container-high space-y-2"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[var(--text)]">{request.method}</span>
                    <span className="text-[var(--muted)]">
                      {new Date(request.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant">{request.path}</p>
                  <details className="text-xs text-on-surface-variant space-y-2" open={isOpen}>
                    <summary
                      className="font-semibold text-[var(--muted)] cursor-pointer"
                      onClick={(event) => {
                        event.preventDefault();
                        toggleRequestKey(requestKey);
                      }}
                    >
                      Show details
                    </summary>
                    <div className="space-y-2">
                      <div>
                        <p className="font-semibold text-[var(--text)]">Headers</p>
                        <pre className="whitespace-pre-wrap text-xs">{formatHeaderLines(request.headers)}</pre>
                      </div>
                      {request.body && (
                        <div>
                          <p className="font-semibold text-[var(--text)]">Body</p>
                          <pre className="whitespace-pre-wrap text-xs">{request.body}</pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
