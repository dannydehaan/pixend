import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Theme = {
  id: string;
  name: string;
  colors: {
    background: string;
    surface: string;
    primary: string;
    text: string;
    muted: string;
    border: string;
    primaryHover: string;
    textOnPrimary: string;
  };
};

export const THEMES: Theme[] = [
  {
    id: "pixels",
    name: "Pixels (Default)",
    colors: {
      background: "#000000",
      surface: "#0a0a0a",
      primary: "#e84c1b",
      text: "#ffffff",
      muted: "#888888",
      border: "#1a1a1a",
      primaryHover: "#ff5a26",
      textOnPrimary: "#ffffff",
    },
  },
  {
    id: "dracula",
    name: "Dracula",
    colors: {
      background: "#282a36",
      surface: "#1e1f29",
      primary: "#bd93f9",
      text: "#f8f8f2",
      muted: "#6272a4",
      border: "#44475a",
      primaryHover: "#d7b4ff",
      textOnPrimary: "#ffffff",
    },
  },
  {
    id: "monokai",
    name: "Monokai",
    colors: {
      background: "#272822",
      surface: "#1e1f1c",
      primary: "#f92672",
      text: "#f8f8f2",
      muted: "#75715e",
      border: "#3e3d32",
      primaryHover: "#ff4f8f",
      textOnPrimary: "#ffffff",
    },
  },
  {
    id: "nord",
    name: "Nord",
    colors: {
      background: "#2e3440",
      surface: "#3b4252",
      primary: "#88c0d0",
      text: "#eceff4",
      muted: "#81a1c1",
      border: "#4c566a",
      primaryHover: "#a0d0e0",
      textOnPrimary: "#0f1111",
    },
  },
  {
    id: "solarized-dark",
    name: "Solarized Dark",
    colors: {
      background: "#002b36",
      surface: "#073642",
      primary: "#b58900",
      text: "#839496",
      muted: "#586e75",
      border: "#073642",
      primaryHover: "#dcb14f",
      textOnPrimary: "#ffffff",
    },
  },
  {
    id: "matrix",
    name: "Matrix",
    colors: {
      background: "#000000",
      surface: "#050505",
      primary: "#00ff00",
      text: "#00ff00",
      muted: "#008f00",
      border: "#003300",
      primaryHover: "#00ff7f",
      textOnPrimary: "#000000",
    },
  },
  {
    id: "light",
    name: "Light",
    colors: {
      background: "#ffffff",
      surface: "#f5f5f5",
      primary: "#2563eb",
      text: "#111111",
      muted: "#666666",
      border: "#e5e5e5",
      primaryHover: "#4c8cf0",
      textOnPrimary: "#ffffff",
    },
  },
];

const DEFAULT_THEME = "pixels";
const STORAGE_KEY = "theme";

const findTheme = (id: string) => THEMES.find((theme) => theme.id === id) ?? THEMES[0];

const toCssVar = (key: string) => `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;

const applyTheme = (theme: Theme) => {
  console.log("Applying theme:", theme.id);
  Object.entries(theme.colors).forEach(([key, value]) => {
    document.documentElement.style.setProperty(toCssVar(key), value);
  });
};

type ThemeContextValue = {
  themeId: string;
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  themes: Theme[];
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeId, setThemeId] = useState(DEFAULT_THEME);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_THEME;
    const theme = findTheme(saved);
    applyTheme(theme);
    setThemeId(theme.id);
  }, []);

  const setTheme = (nextId: string) => {
    const theme = findTheme(nextId);
    window.localStorage.setItem(STORAGE_KEY, theme.id);
    setThemeId(theme.id);
  };
  const setThemeMemo = useCallback(
    (nextId: string) => {
      const theme = findTheme(nextId);
      if (!theme) return;
      window.localStorage.setItem(STORAGE_KEY, theme.id);
      applyTheme(theme);
      setThemeId(theme.id);
    },
    [],
  );

  const value = useMemo(
    () => ({ themeId, currentTheme: findTheme(themeId), setTheme: setThemeMemo, themes: THEMES }),
    [themeId, setThemeMemo],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
