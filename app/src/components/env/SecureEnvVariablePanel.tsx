
import { useEffect, useState } from 'react';
import { listEnvVars, revealEnvVar } from '../../services/secureEnvVariableService';

type EnvVarMetadata = {
  id: number;
  key: string;
  description: string | null;
  sensitive: boolean;
  created_at: string;
  updated_at: string;
};

type Props = {
  environmentId?: string | null;
  collectionId?: string | null;
  title?: string;
};

const maskValue = () => '••••••••';

const SecureEnvVariablePanel = ({ environmentId, collectionId, title = 'Secure variables' }: Props) => {
  const [envVars, setEnvVars] = useState<EnvVarMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<number, string>>({});
  const [copyStatus, setCopyStatus] = useState<Record<number, 'idle' | 'copied' | 'error'>>({});

  useEffect(() => {
    if (!environmentId && !collectionId) {
      setEnvVars([]);
      return;
    }

    setLoading(true);
    setError(null);
    listEnvVars({
      environment_id: environmentId ?? undefined,
      collection_id: collectionId ?? undefined,
    })
      .then(setEnvVars)
      .catch(() => setError('Unable to load secure variables.'))
      .finally(() => setLoading(false));
  }, [environmentId, collectionId]);

  const handleReveal = async (id: number) => {
    if (revealed[id]) return;
    try {
      const value = await revealEnvVar(id);
      setRevealed((prev) => ({ ...prev, [id]: value }));
      setCopyStatus((prev) => ({ ...prev, [id]: 'idle' }));
    } catch {
      setError('Unable to reveal variable.');
    }
  };

  const handleCopy = async (id: number) => {
    try {
      let value = revealed[id];
      if (!value) {
        value = await revealEnvVar(id);
        setRevealed((prev) => ({ ...prev, [id]: value }));
      }
      await navigator.clipboard.writeText(value);
      setCopyStatus((prev) => ({ ...prev, [id]: 'copied' }));
      setTimeout(() => setCopyStatus((prev) => ({ ...prev, [id]: 'idle' })), 2000);
    } catch {
      setCopyStatus((prev) => ({ ...prev, [id]: 'error' }));
    }
  };

  if (!environmentId && !collectionId) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-[var(--muted)]">{title}</p>
          <h3 className="text-lg font-semibold text-on-surface">
            {envVars.length ? 'Stored secrets' : 'No secrets yet'}
          </h3>
        </div>
        {loading && <span className="text-xs text-on-surface-variant">Loading…</span>}
      </div>
      {error && <p className="text-xs text-error/80 mt-2">{error}</p>}
      <div className="mt-4 space-y-3">
        {envVars.map((variable) => {
          const value = revealed[variable.id];
          const displayedValue = value ?? (variable.sensitive ? maskValue() : 'Reveal to view');
          return (
            <div key={variable.id} className="rounded-2xl border border-outline-variant/40 bg-[var(--surface)] p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-on-surface">{variable.key}</p>
                  {variable.description && (
                    <p className="text-[11px] text-on-surface-variant">{variable.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleReveal(variable.id)}
                    className="rounded-full border border-outline-variant/40 px-2 py-1 text-[11px] uppercase tracking-[0.3em] text-on-surface transition-all"
                  >
                    <span className="material-symbols-outlined">{value ? 'visibility_off' : 'visibility'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(variable.id)}
                    className="rounded-full border border-outline-variant/40 px-2 py-1 text-[11px] uppercase tracking-[0.3em] text-on-surface transition-all"
                  >
                    <span className="material-symbols-outlined">content_copy</span>
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs font-mono text-on-surface-variant">{displayedValue}</p>
              <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-on-surface-variant">
                <span>Updated {new Date(variable.updated_at).toLocaleString()}</span>
                <span>
                  {copyStatus[variable.id] === 'copied'
                    ? 'Copied'
                    : copyStatus[variable.id] === 'error'
                    ? 'Copy failed'
                    : ''}
                </span>
              </div>
            </div>
          );
        })}
        {!loading && !envVars.length && (
          <p className="text-xs text-on-surface-variant">No secrets stored for this scope.</p>
        )}
      </div>
    </section>
  );
};

export default SecureEnvVariablePanel;
