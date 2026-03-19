import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HEADER_DEFINITIONS } from "./header-suggestions";
import type { HeaderEntry } from "./types";

type HeaderKeyAutocompleteProps = {
  value: string;
  onSelect: (value: string) => void;
  onChange: (value: string) => void;
};

const HeaderKeyAutocomplete = ({ value, onSelect, onChange }: HeaderKeyAutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    if (!value.trim()) return HEADER_DEFINITIONS;
    const lower = value.toLowerCase();
    return HEADER_DEFINITIONS.filter((header) => header.name.toLowerCase().includes(lower));
  }, [value]);

  const handleBlur = useCallback(() => {
    setTimeout(() => setIsOpen(false), 100);
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!filtered.length) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % filtered.length);
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const target = filtered[highlightedIndex];
        if (target) {
          onSelect(target.name);
        }
        setIsOpen(false);
      }
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    },
    [filtered, highlightedIndex, onSelect],
  );

  useEffect(() => {
    if (highlightedIndex >= filtered.length) {
      setHighlightedIndex(0);
    }
  }, [filtered.length, highlightedIndex]);

  return (
    <div className="relative" ref={containerRef}>
      <input
        className="rounded-lg border border-outline-variant/30 bg-[#0f1326] px-3 py-2 text-sm font-semibold text-on-surface placeholder:text-on-surface-variant focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        placeholder="Header name"
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          onChange(next);
          if (next.trim()) {
            setIsOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (value.trim()) {
            setIsOpen(true);
          }
        }}
        onBlur={handleBlur}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck="false"
      />
      {isOpen && filtered.length > 0 && (
        <div className="absolute top-full mt-1 max-h-52 w-full overflow-auto rounded-2xl border border-outline-variant/30 bg-[#0b1326] shadow-lg">
          {filtered.map((header, index) => (
            <button
              key={header.name}
              type="button"
              className={`w-full px-3 py-2 text-left text-xs text-on-surface hover:bg-[#171f33]/90 ${
                index === highlightedIndex ? "bg-[#171f33]/90" : ""
              }`}
              onMouseDown={(event) => {
                event.preventDefault();
                onSelect(header.name);
                setIsOpen(false);
              }}
            >
              <div className="flex items-center justify-between font-semibold">
                <span>{header.name}</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">{header.category}</span>
              </div>
              <p className="text-[10px] text-on-surface-variant">{header.description}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default HeaderKeyAutocomplete;
