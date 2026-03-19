import type { HeaderEntry } from "./types";
import HeaderRow from "./HeaderRow";

type HeaderListProps = {
  headers: HeaderEntry[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, field: keyof Omit<HeaderEntry, "id">, value: string) => void;
};

const HeaderList = ({ headers, onAdd, onRemove, onChange }: HeaderListProps) => (
  <section className="space-y-3 rounded-2xl border border-[#494454]/30 bg-surface-container-highest p-6">
    <div className="flex items-center justify-between">
      <h2 className="text-xs font-semibold uppercase tracking-[0.4em] text-on-surface-variant">Headers</h2>
      <button
        type="button"
        className="text-xs font-bold uppercase tracking-[0.35em] text-primary/80 hover:text-primary"
        onClick={onAdd}
      >
        + Add header
      </button>
    </div>
    <div className="space-y-3">
      {headers.map((header) => (
        <HeaderRow
          key={header.id}
          header={header}
          onChange={onChange}
          onRemove={onRemove}
        />
      ))}
    </div>
  </section>
);

export default HeaderList;
