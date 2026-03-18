import { ChangeEvent, FormEvent, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { LoginPayload, RegisterPayload } from "../../services/api";

const initialForm = {
  name: "",
  email: "",
  password: "",
  password_confirmation: "",
};

type AuthMode = "login" | "register";

export const LoginScreen = () => {
  const { login, register, status } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange =
    (key: keyof typeof initialForm) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

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

    try {
      if (mode === "login") {
        await login(payload as LoginPayload);
      } else {
        await register(payload as RegisterPayload);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to authenticate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <header className="text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-on-surface-variant">Pixend API</p>
          <h1 className="text-3xl font-semibold mt-2">Welcome back</h1>
          <p className="text-sm text-on-surface-variant">Authenticate to continue managing workspaces.</p>
        </header>

        <section className="rounded-2xl bg-surface shadow-2xl border border-[#494454] p-6 space-y-6">
          <div className="flex justify-between text-xs uppercase tracking-[0.4em] text-on-surface-variant">
            <button
              type="button"
              className={`px-2 pb-1 ${mode === "login" ? "border-b border-[#cf3f14] text-on-surface" : "text-on-surface-variant"}`}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={`px-2 pb-1 ${mode === "register" ? "border-b border-[#cf3f14] text-on-surface" : "text-on-surface-variant"}`}
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>

          {error && <p className="text-sm text-error/80">{error}</p>}

          <form className="space-y-4" onSubmit={handleSubmit}>
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
              disabled={loading || status === "validating"}
              className="w-full flex items-center justify-center py-2 rounded-lg bg-[#e84c1b] text-sm font-semibold uppercase tracking-widest hover:bg-[#cf3f14] transition-all disabled:opacity-60"
            >
              {loading ? "Working..." : mode === "login" ? "Login" : "Register"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
