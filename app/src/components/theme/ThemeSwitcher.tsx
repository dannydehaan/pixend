import { useTheme } from "../../contexts/ThemeContext";

const ThemeSwitcher = () => {
  const { themeId, setTheme, themes } = useTheme();

  return (
    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.4em] text-[var(--muted)]">
      <label htmlFor="theme-selector" className="text-[var(--muted)]">
        Theme
      </label>
      <select
        id="theme-selector"
        value={themeId}
        onChange={(event) => setTheme(event.target.value)}
        className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        {themes.map((theme) => (
          <option key={theme.id} value={theme.id}>
            {theme.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ThemeSwitcher;
