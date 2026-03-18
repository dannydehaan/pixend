import { FormEvent, useEffect, useMemo, useState } from "react";
import "./App.css";
import { apiClient, AuthResponse, LoginPayload, RegisterPayload, Workspace } from "./services/api";

const initialForm = {
  name: "Danny de Haan",
  email: "danny@mediaboost.nl",
  password: "annuleren",
  password_confirmation: "annuleren",
};

type AuthMode = "login" | "register";

const AuthForm = ({
  mode,
  loading,
  error,
  onSubmit,
  onModeChange,
}: {
  mode: AuthMode;
  loading: boolean;
  error?: string | null;
  onSubmit: (payload: RegisterPayload | LoginPayload) => Promise<void>;
  onModeChange: (mode: AuthMode) => void;
}) => {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    setForm(initialForm);
  }, [mode]);

  const handleChange = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload =
      mode === "login"
        ? {
            email: form.email,
            password: form.password,
          }
        : {
            name: form.name,
            email: form.email,
            password: form.password,
            password_confirmation: form.password_confirmation,
          };

    onSubmit(payload as RegisterPayload | LoginPayload).catch(() => {});
  };

  const title = mode === "login" ? "Login" : "Register";

  return (
    <section className="max-w-md w-full p-6 rounded-2xl bg-surface shadow-2xl border border-[#494454] space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="text-sm text-on-surface-variant">Connect to the Pixend API to manage workspaces.</p>
      </header>

      {error && <p className="text-sm text-error/80">{error}</p>}

      <form className="space-y-4" onSubmit={submit}>
        {mode === "register" && (
          <div>
            <label className="text-xs uppercase tracking-widest text-on-surface-variant" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              value={form.name}
              onChange={handleChange("name")}
              required
              className="w-full mt-1 rounded-lg bg-surface-container-low border border-[#494454] px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            />
          </div>
        )}

        <div>
          <label className="text-xs uppercase tracking-widest text-on-surface-variant" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            required
            className="w-full mt-1 rounded-lg bg-surface-container-low border border-[#494454] px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-on-surface-variant" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={handleChange("password")}
            required
            className="w-full mt-1 rounded-lg bg-surface-container-low border border-[#494454] px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          />
        </div>

        {mode === "register" && (
          <div>
            <label className="text-xs uppercase tracking-widest text-on-surface-variant" htmlFor="password_confirmation">
              Confirm Password
            </label>
            <input
              id="password_confirmation"
              type="password"
              value={form.password_confirmation}
              onChange={handleChange("password_confirmation")}
              required
              className="w-full mt-1 rounded-lg bg-surface-container-low border border-[#494454] px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center py-2 rounded-lg bg-[#e84c1b] text-sm font-semibold uppercase tracking-widest hover:bg-[#cf3f14] transition-all disabled:opacity-60"
        >
          {loading ? "Working..." : title}
        </button>
      </form>

      <p className="text-xs text-on-surface-variant">
        {mode === "login" ? "Need an account?" : "Already have an account?"}
        <button
          type="button"
          onClick={() => onModeChange(mode === "login" ? "register" : "login")}
          className="ml-2 underline underline-offset-4"
        >
          {mode === "login" ? "Register" : "Login"}
        </button>
      </p>
    </section>
  );
};

const WorkspaceCard = ({ workspace }: { workspace: Workspace }) => (
  <article className="bg-surface-container-lowest border border-[#494454] rounded-2xl p-5 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-on-surface">{workspace.name}</h3>
        <p className="text-xs text-on-surface-variant">{workspace.slug}</p>
      </div>
      <span className="text-[10px] uppercase tracking-[0.3em] text-primary">Workspace</span>
    </div>
    <p className="text-sm text-on-surface-variant">{workspace.description || "No description"}</p>
    <div className="flex flex-wrap gap-2">
      {workspace.users?.map((user) => (
        <span key={user.id} className="text-xs px-3 py-1 rounded-full bg-surface-container-highest">
          {user.name}
        </span>
      ))}
    </div>
  </article>
);

function App() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  const badgeText = useMemo(() => {
    if (token) {
      return `Connected · ${workspaces.length} workspace${workspaces.length === 1 ? "" : "s"}`;
    }
    return "Offline";
  }, [token, workspaces]);

  const loadWorkspaces = async () => {
    setWorkspaceLoading(true);
    try {
      const list = await apiClient.fetchWorkspaces();
      setWorkspaces(list);
      setStatus("");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unable to load workspaces");
    } finally {
      setWorkspaceLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await apiClient.getPersistedToken();
      if (stored && active) {
        setToken(stored);
        await loadWorkspaces();
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleAuth = async (payload: RegisterPayload | LoginPayload) => {
    setLoading(true);
    setError(null);
    try {
      const result = (mode === "login"
        ? await apiClient.login(payload as LoginPayload)
        : await apiClient.register(payload as RegisterPayload)) as AuthResponse;

      await apiClient.persistToken(result.token);
      setToken(result.token);
      await loadWorkspaces();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await apiClient.logout();
    await apiClient.clearToken();
    setToken(null);
    setWorkspaces([]);
    setStatus("Logged out");
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-body flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid gap-8 lg:grid-cols-2">
        <div className="space-y-5">
          <p className="text-xs uppercase tracking-[0.4em] text-on-surface-variant">Pixend API</p>
          <h1 className="text-4xl font-headline font-bold">Manage workspaces with Pixend</h1>
          <p className="text-sm text-on-surface-variant">
            Authenticate with your Laravel backend and keep your workspace inventory in sync. The token is stored securely
            and attached to every request.
          </p>
          <div className="flex items-center gap-3 rounded-full px-4 py-2 bg-surface-container-highest text-xs uppercase tracking-[0.4em] text-on-surface">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {badgeText}
          </div>
          {token && (
            <button
              onClick={handleLogout}
              className="text-sm text-primary/80 hover:text-primary transition-colors"
            >
              Disconnect
            </button>
          )}
        </div>

        {token ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your workspaces</h2>
              <span className="text-xs text-on-surface-variant">{workspaceLoading ? "Refreshing..." : "Up to date"}</span>
            </div>

            {status && <p className="text-xs text-error/80">{status}</p>}

            <div className="grid gap-4">
              {workspaces.length === 0 && !workspaceLoading ? (
                <p className="text-sm text-on-surface-variant">No workspaces yet. Create one to get started.</p>
              ) : (
                workspaces.map((workspace) => <WorkspaceCard key={workspace.id} workspace={workspace} />)
              )}
            </div>
          </div>
        ) : (
          <AuthForm mode={mode} loading={loading} error={error} onSubmit={handleAuth} onModeChange={setMode} />
        )}
      </div>
    </div>
  );
}

export default App;
