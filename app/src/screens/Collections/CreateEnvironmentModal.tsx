import { FormEvent, useEffect, useState } from "react";
import { apiClient, Collection } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { addGuestEnvironment } from "../../services/guestStorage";

type Props = {
  open: boolean;
  collection: Collection | null;
  onClose: () => void;
  onSuccess: () => void;
};

export const CreateEnvironmentModal = ({ open, collection, onClose, onSuccess }: Props) => {
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");
  const { isGuest } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setName("");
      setRegion("");
      setDescription("");
      setGlobalError(null);
      setFieldErrors({});
    }
  }, [open, collection]);

  const canSubmit = Boolean(collection) && name.trim().length > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!collection) {
      return;
    }

    setGlobalError(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      if (isGuest) {
        await addGuestEnvironment({
          collectionId: collection.id,
          name: name.trim(),
          region: region || undefined,
          description: description.trim() || undefined,
        });
      } else {
        await apiClient.createEnvironment({
          collection_id: collection.id,
          name: name.trim(),
          region: region || undefined,
          description: description.trim() || undefined,
        });
      }
      onSuccess();
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

  if (!open || !collection) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-[#494454] bg-surface-container-high p-6 space-y-5"
      >
        <header>
          <p className="text-xs uppercase tracking-[0.4em] text-on-surface-variant">New Environment</p>
          <h2 className="text-2xl font-semibold">Add an environment for {collection.name}</h2>
        </header>
        {globalError && <p className="text-sm text-error/80">{globalError}</p>}
        <div className="space-y-3">
          <label className="text-xs uppercase tracking-[0.4em] text-on-surface-variant" htmlFor="environment-name">
            Environment name
          </label>
          <input
            id="environment-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-lg bg-surface-container-low border border-[#494454] px-3 py-2 text-sm"
          />
          {fieldErrors.name && <p className="text-xs text-error/80">{fieldErrors.name}</p>}
        </div>
        <div className="space-y-3">
          <label className="text-xs uppercase tracking-[0.4em] text-on-surface-variant" htmlFor="environment-region">
            Region
          </label>
          <input
            id="environment-region"
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            className="w-full rounded-lg bg-surface-container-low border border-[#494454] px-3 py-2 text-sm"
          />
          {fieldErrors.region && <p className="text-xs text-error/80">{fieldErrors.region}</p>}
        </div>
        <div className="space-y-3">
          <label className="text-xs uppercase tracking-[0.4em] text-on-surface-variant" htmlFor="environment-description">
            Description
          </label>
          <textarea
            id="environment-description"
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
            {submitting ? "Adding…" : "Create Environment"}
          </button>
        </div>
      </form>
    </div>
  );
};
