import type { ChangeEvent } from "react";

type MethodSelectorProps = {
  methods: string[];
  value: string;
  onChange: (method: string) => void;
};

const MethodSelector = ({ methods, value, onChange }: MethodSelectorProps) => {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="relative min-w-[100px]">
      <select
        className="appearance-none w-full bg-surface-container-high border-none rounded-lg py-3 pl-4 pr-10 text-xs font-black mono text-primary focus:ring-1 focus:ring-primary cursor-pointer"
        value={value}
        onChange={handleChange}
      >
        {methods.map((method) => (
          <option key={method}>{method}</option>
        ))}
      </select>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm pointer-events-none text-on-surface-variant/40">
        expand_more
      </span>
    </div>
  );
};

export default MethodSelector;
