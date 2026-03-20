import type { ChangeEvent, RefObject } from "react";

type UrlInputProps = {
  value: string;
  onChange: (value: string) => void;
  datalistId?: string;
  datalistOptions?: string[];
  inputRef?: RefObject<HTMLInputElement>;
};

const UrlInput = ({ value, onChange }: UrlInputProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="flex-1 relative">
      <input
        className="w-full h-full bg-surface-container-high border-none rounded-lg px-4 py-3 text-sm mono text-on-surface focus:ring-1 focus:ring-primary"
        type="text"
        value={value}
        onChange={handleChange}
        list={datalistId}
        ref={inputRef}
      />
      {datalistId && datalistOptions?.length && (
        <datalist id={datalistId}>
          {datalistOptions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      )}
    </div>
  );
};

export default UrlInput;
