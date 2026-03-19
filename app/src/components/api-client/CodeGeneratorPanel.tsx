import { useEffect, useMemo, useState } from "react";
import {
  defaultCodeOption,
  generateCode,
  languageGroups,
  type CodeGeneratorRequest,
  type CodeOption,
} from "../../lib/codeGenerator";

type CodeGeneratorPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  request: CodeGeneratorRequest;
};

const allOptions = languageGroups.flatMap((group) => group.options);

const CodeGeneratorPanel = ({ isOpen, onClose, request }: CodeGeneratorPanelProps) => {
  const [selectedOption, setSelectedOption] = useState<CodeOption>(defaultCodeOption);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

  useEffect(() => {
    setCopyStatus("idle");
  }, [selectedOption, request]);

  const code = useMemo(() => generateCode(request, selectedOption), [request, selectedOption]);

  const handleCopy = async () => {
    try {
      if (!navigator?.clipboard) {
        throw new Error("Clipboard unavailable");
      }
      await navigator.clipboard.writeText(code);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("idle");
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-on-surface-variant/40 p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-on-surface-variant">Code Generator</p>
            <p className="text-lg font-semibold text-on-surface">Copy-ready snippets</p>
          </div>
          <button
            type="button"
            className="text-sm font-semibold uppercase tracking-[0.4em] text-on-surface-variant hover:text-on-surface"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="space-y-4 p-4">
          <div>
            <label htmlFor="code-language" className="text-xs font-semibold uppercase tracking-[0.4em] text-on-surface-variant">
              Language / framework
            </label>
            <select
              id="code-language"
              className="mt-2 w-full rounded-xl border border-outline bg-surface py-2 px-3 text-sm text-on-surface focus:border-primary focus:outline-none"
              value={selectedOption.id}
              onChange={(event) => {
                const next = allOptions.find((option) => option.id === event.target.value);
                if (next) {
                  setSelectedOption(next);
                }
              }}
            >
              {languageGroups.map((group) => (
                <optgroup label={group.language} key={group.language}>
                  {group.options.map((option) => (
                    <option value={option.id} key={option.id}>
                      {option.framework}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.4em] text-on-surface-variant">Generated code</p>
            <button
              type="button"
              className="rounded-full border border-outline px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-on-surface-variant transition hover:border-primary hover:text-primary"
              onClick={handleCopy}
            >
              {copyStatus === "copied" ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="rounded-2xl border border-on-surface-variant/40 bg-surface-container-low p-4">
            <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap text-sm font-mono leading-relaxed text-on-surface">
              {code}
            </pre>
          </div>
          <p className="text-xs text-on-surface-variant">
            Some frameworks are still a work in progress. Select another language to regenerate with minimal delay.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CodeGeneratorPanel;
