import type { QueryParam } from "./types";

type QueryParamRowProps = {
  param: QueryParam;
  onChange: (id: string, field: keyof Omit<QueryParam, "id">, value: string) => void;
  onRemove: (id: string) => void;
};

const QueryParamRow = ({ param, onChange, onRemove }: QueryParamRowProps) => (
  <div key={param.id} className="grid items-center gap-3 md:grid-cols-[2fr_2fr_auto]">
    <input
      className="rounded-lg border border-outline-variant/30 bg-[#0f1326] px-3 py-2 text-sm font-semibold text-on-surface placeholder:text-on-surface-variant focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      placeholder="Key"
      value={param.key}
      onChange={(event) => onChange(param.id, "key", event.target.value)}
      autoCapitalize="off"
      autoCorrect="off"
      autoComplete="off"
      spellCheck="false"
    />
    <input
      className="rounded-lg border border-outline-variant/30 bg-[#0f1326] px-3 py-2 text-sm font-semibold text-on-surface placeholder:text-on-surface-variant focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      placeholder="Value"
      value={param.value}
      onChange={(event) => onChange(param.id, "value", event.target.value)}
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck="false"
    />
    <button
      type="button"
      className="rounded-lg border border-outline-variant/50 p-2 text-xs text-on-surface-variant hover:border-error hover:text-error"
      onClick={() => onRemove(param.id)}
      aria-label="Remove query parameter"
    >
      <span className="material-symbols-outlined text-sm">close</span>
    </button>
  </div>
);

export default QueryParamRow;
