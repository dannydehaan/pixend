import QueryParamRow from "./QueryParamRow";
import type { QueryParam } from "./types";

type QueryParamsEditorProps = {
  params: QueryParam[];
  onAdd: () => void;
  onChangeRow: (id: string, field: keyof Omit<QueryParam, "id">, value: string) => void;
  onRemove: (id: string) => void;
};

const QueryParamsEditor = ({ params, onAdd, onChangeRow, onRemove }: QueryParamsEditorProps) => (
  <section className="space-y-3 rounded-2xl border border-[#494454]/30 bg-surface-container-highest p-6">
    <div className="flex items-center justify-between">
      <h2 className="text-xs font-semibold uppercase tracking-[0.4em] text-on-surface-variant">Query Params</h2>
      <button
        type="button"
        className="text-xs font-bold uppercase tracking-[0.35em] text-primary/80 hover:text-primary"
        onClick={onAdd}
      >
        + Add param
      </button>
    </div>
    <div className="space-y-3">
      {params.length ? (
        params.map((param) => (
          <QueryParamRow key={param.id} param={param} onChange={onChangeRow} onRemove={onRemove} />
        ))
      ) : (
        <p className="text-[11px] text-on-surface-variant">Add query parameters to build a URL query string.</p>
      )}
    </div>
  </section>
);

export default QueryParamsEditor;
