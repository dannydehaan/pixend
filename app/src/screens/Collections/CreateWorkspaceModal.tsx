import { FormEvent, useEffect, useState } from "react";
import { Workspace } from "../../services/api";
import { workspaceService } from "../../services/workspaceService";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (workspace: Workspace) => void;
};

export const CreateWorkspaceModal = ({ open, onClose, onSuccess }: Props) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setName("");
    setDescription("");
    setGlobalError(null);
    setFieldErrors({});
  }, [open]);

  const canSubmit = name.trim().length > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      setGlobalError("Workspace name is required");
      return;
    }

    setSubmitting(true);
    setGlobalError(null);
    setFieldErrors({});

    try {
      const workspace = await workspaceService.createWorkspace({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      onSuccess(workspace);
    } catch (error) {
      const typed = error as Error & { details?: Record<string, string[]> };
      if (typed.details) {
        setFieldErrors(
          Object.fromEntries(Object.entries(typed.details).map(([key, errors]) => [key, errors[0]])),
        );
      }
      setGlobalError(typed.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-[#494454] bg-surface-container-high p-6 space-y-5"
      >
        <header>
          <p className="text-xs uppercase tracking-[0.4em] text-on-surface-variant">New Workspace</p>
          <h2 className="text-2xl font-semibold">Create a workspace</h2>
        </header>
        {globalError && <p className="text-sm text-error/80">{globalError}</p>}
        <div className="space-y-3">
          <label className="text-xs uppercase tracking-[0.4em] text-on-surface-variant" htmlFor="workspace-name">
            Name
          </label>
          <input
            id="workspace-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-lg bg-surface-container-low border border-[#494454] px-3 py-2 text-sm"
          />
          {fieldErrors.name && <p className="text-xs text-error/80">{fieldErrors.name}</p>}
        </div>
        <div className="space-y-3">
          <label
            className="text-xs uppercase tracking-[0.4em] text-on-surface-variant"
            htmlFor="workspace-description"
          >
            Description
          </label>
          <textarea
            id="workspace-description"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full rounded-lg bg-surface-container-low border border-[#494454] px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#494454] text-xs uppercase tracking-[0.4em]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs uppercase tracking-[0.4em] disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create Workspace"}
          </button>
        </div>
      </form>
    </div>
  );
};
