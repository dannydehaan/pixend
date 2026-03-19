import { useCallback, useRef, type KeyboardEvent } from "react";
import type { BodyType } from "./types";

type BodyEditorProps = {
  bodyType: BodyType;
  body: string;
  onBodyChange: (body: string) => void;
  onBodyTypeChange: (bodyType: BodyType) => void;
  validationError?: string | null;
  onSendRequest: () => void;
};

const BodyEditor = ({
  bodyType,
  body,
  onBodyChange,
  onBodyTypeChange,
  validationError,
  onSendRequest,
}: BodyEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        onSendRequest();
        return;
      }

      if (event.key !== "Tab") return;
      event.preventDefault();

      const textarea = event.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const before = body.substring(0, start);
      const after = body.substring(end);
      const newValue = `${before}\t${after}`;

      onBodyChange(newValue);

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1;
        }
      });
    },
    [body, onBodyChange, onSendRequest],
  );

  return (
    <section className="space-y-4 rounded-2xl border border-[#494454]/30 bg-surface-container-lowest p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.4em] text-on-surface-variant">Body</h2>
          <p className="text-[11px] text-on-surface-variant">Only used when the selected method supports a payload.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-on-surface-variant" htmlFor="body-type">
            Payload
          </label>
          <select
            id="body-type"
            className="rounded-lg border border-outline-variant/30 bg-[#0f1326] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.35em] text-on-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            value={bodyType}
            onChange={(event) => onBodyTypeChange(event.target.value as BodyType)}
          >
            <option value="none">None</option>
            <option value="json">Raw (JSON)</option>
          </select>
        </div>
      </div>
      {bodyType === "json" && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.35em] text-on-surface-variant">Raw JSON</p>
          <textarea
            ref={textareaRef}
            rows={10}
            className="w-full rounded-2xl border border-outline-variant/30 bg-[#0b1326] px-4 py-3 text-sm font-mono text-on-surface placeholder:text-on-surface-variant focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            placeholder={`{\n  "name": "value"\n}`}
            value={body}
            onChange={(event) => onBodyChange(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          {validationError && <p className="text-xs text-error font-semibold">{validationError}</p>}
        </div>
      )}
    </section>
  );
};

export default BodyEditor;
