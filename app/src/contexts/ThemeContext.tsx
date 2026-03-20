import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { apiClient } from "../services/api";
import { useAuth } from "./AuthContext";

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
    responseKey: string;
    responseValue: string;
    responseString: string;
    responseNumber: string;
    responseBoolean: string;
    responseNull: string;
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
      responseKey: "#e84c1b",
      responseValue: "#ffffff",
      responseString: "#ffffff",
      responseNumber: "#f5a97f",
      responseBoolean: "#ffb86c",
      responseNull: "#888888",
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
      responseKey: "#bd93f9",
      responseValue: "#f8f8f2",
      responseString: "#f5a97f",
      responseNumber: "#8be9fd",
      responseBoolean: "#50fa7b",
      responseNull: "#6272a4",
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
      responseKey: "#f92672",
      responseValue: "#f8f8f2",
      responseString: "#ff79c6",
      responseNumber: "#fd971f",
      responseBoolean: "#ae81ff",
      responseNull: "#75715e",
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
      responseKey: "#88c0d0",
      responseValue: "#eceff4",
      responseString: "#8fbcbb",
      responseNumber: "#ebcb8b",
      responseBoolean: "#a3be8c",
      responseNull: "#4c566a",
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
      responseKey: "#b58900",
      responseValue: "#839496",
      responseString: "#b58900",
      responseNumber: "#cb4b16",
      responseBoolean: "#2aa198",
      responseNull: "#586e75",
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
      responseKey: "#00ff00",
      responseValue: "#00ff00",
      responseString: "#aaffaa",
      responseNumber: "#66ff66",
      responseBoolean: "#55ff55",
      responseNull: "#008f00",
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
      responseKey: "#2563eb",
      responseValue: "#111111",
      responseString: "#60a5fa",
      responseNumber: "#7dd3fc",
      responseBoolean: "#34d399",
      responseNull: "#94a3b8",
    },
  },
];

const DEFAULT_THEME = "pixels";
const STORAGE_KEY = "theme";

const findTheme = (id: string) => THEMES.find((theme) => theme.id === id) ?? THEMES[0];

const toCssVar = (key: string) => `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;

const applyTheme = (theme: Theme) => {
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
  const { user, isAuthenticated, isGuest } = useAuth();
  const [themeId, setThemeId] = useState(DEFAULT_THEME);
  const lastRemoteTheme = useRef<string | null>(null);

  const persistTheme = useCallback((nextId: string) => {
    const theme = findTheme(nextId);
    window.localStorage.setItem(STORAGE_KEY, theme.id);
    applyTheme(theme);
    setThemeId(theme.id);
    return theme.id;
  }, []);

  const setTheme = useCallback(
    (nextId: string) => {
      const appliedId = persistTheme(nextId);
      if (isAuthenticated && !isGuest) {
        apiClient.updateUserThemePreference(appliedId).catch(() => {});
      }
    },
    [isAuthenticated, isGuest, persistTheme],
  );

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    persistTheme(saved ?? DEFAULT_THEME);
  }, [persistTheme]);

  useEffect(() => {
    const remoteTheme = user?.preferred_theme;
    if (!remoteTheme) {
      lastRemoteTheme.current = null;
      return;
    }

    if (lastRemoteTheme.current === remoteTheme) {
      return;
    }

    lastRemoteTheme.current = remoteTheme;
    persistTheme(remoteTheme);
  }, [persistTheme, user?.preferred_theme]);

  const value = useMemo(
    () => ({ themeId, currentTheme: findTheme(themeId), setTheme, themes: THEMES }),
    [setTheme, themeId],
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
