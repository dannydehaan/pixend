import { useCallback, useEffect, useMemo, useState } from "react";
import { HEADER_VALUE_SUGGESTIONS } from "./header-suggestions";
import type { HeaderEntry } from "./types";

type HeaderValueAutocompleteProps = {
  headerKey: string;
  value: string;
  onSelect: (value: string) => void;
  onChange: (value: string) => void;
};

const HeaderValueAutocomplete = ({ headerKey, value, onSelect, onChange }: HeaderValueAutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const source = HEADER_VALUE_SUGGESTIONS[headerKey.trim()] ?? [];

  const filtered = useMemo(() => {
    if (!value.trim()) return source;
    const lower = value.toLowerCase();
    return source.filter((entry) => entry.toLowerCase().includes(lower));
  }, [source, value]);

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
          onSelect(target);
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
    <div className="relative">
      <input
        className="rounded-lg border border-outline-variant/30 bg-[#0f1326] px-3 py-2 text-sm font-semibold text-on-surface placeholder:text-on-surface-variant focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        placeholder="Header value"
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          onChange(next);
          if (next.trim() && source.length > 0) {
            setIsOpen(true);
          }
        }}
        onFocus={() => {
          if (value.trim() && source.length > 0) {
            setIsOpen(true);
          }
        }}
        onBlur={() => setTimeout(() => setIsOpen(false), 120)}
        onKeyDown={handleKeyDown}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
      />
      {isOpen && filtered.length > 0 && (
        <div className="absolute top-full mt-1 max-h-44 w-full overflow-auto rounded-2xl border border-outline-variant/30 bg-[#0b1326] shadow-lg">
          {filtered.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              className={`w-full text-left px-3 py-2 text-xs text-on-surface hover:bg-[#171f33]/80 ${
                index === highlightedIndex ? "bg-[#171f33]/80" : ""
              }`}
              onMouseDown={(event) => {
                event.preventDefault();
                onSelect(suggestion);
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default HeaderValueAutocomplete;
