import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { EnvironmentPayload, deleteEnvironment, loadEnvironments, saveEnvironment } from "../../services/environmentService";
import {
  getActiveEnvironmentId,
  setActiveEnvironmentId,
  subscribeActiveEnvironmentId,
} from "../../services/environmentSelection";

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const EnvironmentsScreen = () => {
  const { encryptionKey, isAuthenticated } = useAuth();
  const [environments, setEnvironments] = useState<EnvironmentPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pendingEnvironmentsRef = useRef<EnvironmentPayload[]>([]);

  useEffect(() => {
    if (!encryptionKey) return;
    setLoading(true);
    loadEnvironments(encryptionKey, isAuthenticated)
      .then((records) => {
        setEnvironments(records);
        const storedId = getActiveEnvironmentId();
        const fallbackId = records[0]?.id ?? null;
        const resolvedId = storedId && records.some((env) => env.id === storedId) ? storedId : fallbackId;
        if (resolvedId) {
          const target = records.find((env) => env.id === resolvedId);
          if (target) {
            setActiveId(target.id);
            setActiveEnvironmentId(target.id);
          }
        } else {
          setActiveId(null);
          setActiveEnvironmentId(null);
        }
      })
      .catch(() => {
        setError("Failed to load environments.");
      })
      .finally(() => setLoading(false));
  }, [encryptionKey, isAuthenticated]);

  useEffect(() => {
    const unsubscribe = subscribeActiveEnvironmentId((value) => {
      setActiveId(value);
    });
    return unsubscribe;
  }, []);

  const activeEnvironment = useMemo(() => {
    return environments.find((env) => env.id === activeId) ?? null;
  }, [activeId, environments]);

  const persistEnvironment = async (env: EnvironmentPayload) => {
    if (!encryptionKey) return;
    try {
      await saveEnvironment(env, encryptionKey, isAuthenticated);
    } catch {
      setError("Unable to save environment.");
    }
  };

  const handleCreate = async () => {
    const newEnv: EnvironmentPayload = {
      id: generateId(),
      name: "New Environment",
      variables: {},
    };
    setEnvironments((prev) => [...prev, newEnv]);
    setActiveEnvironmentId(newEnv.id);
    setActiveId(newEnv.id);
    if (encryptionKey) {
      await persistEnvironment(newEnv);
    } else {
      pendingEnvironmentsRef.current = [...pendingEnvironmentsRef.current, newEnv];
    }
  };

  const handleDelete = async (id: string) => {
    if (!encryptionKey) return;
    await deleteEnvironment(id, isAuthenticated);
    const wasActive = activeId === id;
    setEnvironments((prev) => {
      const next = prev.filter((env) => env.id !== id);
      if (wasActive) {
        const nextId = next[0]?.id ?? null;
        setActiveEnvironmentId(nextId);
        setActiveId(nextId);
      }
      return next;
    });
  };

  const updateEnvironment = (id: string, updater: (env: EnvironmentPayload) => EnvironmentPayload) => {
    setEnvironments((prev) => {
      const next = prev.map((env) => (env.id === id ? updater(env) : env));
      const updatedEnv = next.find((env) => env.id === id);
      if (updatedEnv) {
        persistEnvironment(updatedEnv);
      }
      return next;
    });
  };

  const handleVariableChange = (key: string, value: string) => {
    if (!activeEnvironment) return;
    updateEnvironment(activeEnvironment.id, (env) => {
      const variables = { ...(env.variables ?? {}) };
      if (!key.trim()) {
        delete variables[key];
      } else {
        variables[key] = value;
      }
      return { ...env, variables };
    });
  };

  const handleAddVariable = () => {
    if (!activeEnvironment) return;
    updateEnvironment(activeEnvironment.id, (env) => {
      const variables = { ...(env.variables ?? {}) };
      const newKey = `var_${Date.now()}`;
      variables[newKey] = "";
      return { ...env, variables };
    });
  };

  const handleDeleteVariable = (key: string) => {
    if (!activeEnvironment) return;
    updateEnvironment(activeEnvironment.id, (env) => {
      const variables = { ...(env.variables ?? {}) };
      delete variables[key];
      return { ...env, variables };
    });
  };

  const handleSelect = (id: string) => {
    setActiveEnvironmentId(id);
    setActiveId(id);
  };

  const rows = useMemo(() => {
    if (!activeEnvironment) return [];
    return Object.entries(activeEnvironment.variables ?? {}).map(([key, value], index) => ({
      id: `${activeEnvironment.id}-${index}`,
      key,
      value,
    }));
  }, [activeEnvironment]);

  useEffect(() => {
    if (!encryptionKey || !pendingEnvironmentsRef.current.length) return;
    const pending = [...pendingEnvironmentsRef.current];
    pendingEnvironmentsRef.current = [];
    pending.forEach((env) => {
      persistEnvironment(env);
    });
  }, [encryptionKey]);

  return (
    <div className="flex h-full gap-6 p-6">
      <aside className="flex w-[280px] flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--muted)]">Environments</h2>
          <button
            type="button"
            onClick={handleCreate}
            className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary"
          >
            + New
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {environments.map((env) => {
            const isActive = env.id === activeId;
            return (
              <button
                key={env.id}
                type="button"
                onClick={() => handleSelect(env.id)}
                className={`w-full rounded-xl border px-3 py-2 text-left transition-all ${
                  isActive
                    ? "border-primary bg-primary/[0.07] text-primary"
                    : "border-transparent text-on-surface hover:border-outline-variant/60"
                }`}
              >
                <p className="text-sm font-semibold">{env.name}</p>
                <p className="text-[11px] text-on-surface-variant">{Object.keys(env.variables ?? {}).length} variables</p>
              </button>
            );
          })}
          {!environments.length && !loading && (
            <p className="text-sm text-on-surface-variant">Create your first environment.</p>
          )}
        </div>
      </aside>
      <section className="flex flex-1 flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        {loading && <p className="text-sm text-on-surface-variant">Loading…</p>}
        {error && <p className="text-sm text-error">{error}</p>}
        {!activeEnvironment && !loading ? (
          <div className="flex flex-1 flex-col items-center justify-center text-sm text-on-surface-variant">
            <p className="font-semibold text-[var(--text)]">No environment selected</p>
            <p>Create one from the sidebar to start using variables.</p>
          </div>
        ) : activeEnvironment ? (
          <>
            <div className="flex flex-col gap-2">
                <input
                  className="rounded-lg border border-outline-variant/40 bg-[var(--surface)] px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  value={activeEnvironment.name}
                  onChange={(event) =>
                    updateEnvironment(activeEnvironment.id, (env) => ({
                      ...env,
                      name: event.target.value,
                    }))
                  }
                />
              <button
                type="button"
                onClick={() => handleDelete(activeEnvironment.id)}
                className="text-[11px] font-semibold uppercase tracking-[0.3em] text-error"
              >
                Delete environment
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-3 overflow-hidden">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">Variables</h3>
                <button
                  type="button"
                  onClick={handleAddVariable}
                  className="rounded-full border border-outline-variant/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em]"
                >
                  Add variable
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                <div className="space-y-2">
                  {rows.map((row) => (
                    <div key={row.id} className="flex items-center gap-2">
                      <input
                        className="flex-1 rounded-lg border border-outline-variant/40 bg-[var(--surface)] px-3 py-2 text-sm"
                        value={row.key}
                        onChange={(event) => {
                          const newKey = event.target.value;
                          updateEnvironment(activeEnvironment.id, (env) => {
                            const variables = { ...(env.variables ?? {}) };
                            delete variables[row.key];
                            if (newKey.trim()) {
                              variables[newKey] = row.value;
                            }
                            return { ...env, variables };
                          });
                        }}
                      />
                      <input
                        className="flex-1 rounded-lg border border-outline-variant/40 bg-[var(--surface)] px-3 py-2 text-sm"
                        value={row.value}
                        onChange={(event) => {
                          const next = event.target.value;
                          handleVariableChange(row.key, next);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteVariable(row.key)}
                        className="text-xs font-semibold uppercase tracking-[0.3em] text-error"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
};

export default EnvironmentsScreen;
