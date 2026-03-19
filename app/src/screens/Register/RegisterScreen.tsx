import { FormEvent, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

export const RegisterScreen = () => {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => email.trim() !== "" && password.trim() !== "" && confirmPassword.trim() !== "",
    [confirmPassword, email, password],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords must match.");
      return;
    }

    setIsSubmitting(true);
    const inferredName = email.includes("@") ? email.split("@")[0] : email;
    const payloadName = inferredName.trim() || email.trim() || "Guest";
    try {
      await register({
        name: payloadName,
        email: email.trim(),
        password,
        password_confirmation: confirmPassword,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create account. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-8 pt-12 pb-16 bg-[var(--background)] text-[var(--text)] min-h-screen">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-secondary/60">Create account</p>
          <h1 className="text-4xl font-bold">Register to sync across devices</h1>
          <p className="text-sm text-on-surface-variant">
            Creating an account protects your workspace, backs up your collections, and keeps your data in sync wherever you go.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-lg shadow-black/30"
        >
          {error && (
            <p className="text-sm text-error/80 uppercase tracking-[0.3em] text-center">{error}</p>
          )}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--primary)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.4em] text-[var(--text-on-primary)] transition-all disabled:opacity-60"
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
};
