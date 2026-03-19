import HeaderKeyAutocomplete from "./HeaderKeyAutocomplete";
import HeaderValueAutocomplete from "./HeaderValueAutocomplete";
import type { HeaderEntry } from "./types";

type HeaderRowProps = {
  header: HeaderEntry;
  onChange: (id: string, field: keyof Omit<HeaderEntry, "id">, value: string) => void;
  onRemove: (id: string) => void;
};

const HeaderRow = ({ header, onChange, onRemove }: HeaderRowProps) => (
  <div className="grid items-center gap-3 md:grid-cols-[2fr_2fr_auto]">
    <HeaderKeyAutocomplete
      value={header.key}
      onChange={(value) => onChange(header.id, "key", value)}
      onSelect={(value) => onChange(header.id, "key", value)}
    />
    <HeaderValueAutocomplete
      headerKey={header.key}
      value={header.value}
      onChange={(value) => onChange(header.id, "value", value)}
      onSelect={(value) => onChange(header.id, "value", value)}
    />
    <button
      type="button"
      className="rounded-lg border border-outline-variant/50 p-2 text-xs text-on-surface-variant hover:border-error hover:text-error"
      onClick={() => onRemove(header.id)}
      aria-label="Remove header"
    >
      <span className="material-symbols-outlined text-sm">close</span>
    </button>
  </div>
);

export default HeaderRow;
