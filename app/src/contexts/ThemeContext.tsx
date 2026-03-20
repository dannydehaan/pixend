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
import { DEFAULT_THEME_ID, FALLBACK_THEME_MAP, FALLBACK_THEMES, type ThemePalette } from "../lib/themePalettes";

const STORAGE_KEY = "theme";

const toCssVar = (key: string) => `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;

const applyThemePalette = (theme: ThemePalette) => {
  Object.entries(theme.colors).forEach(([key, value]) => {
    document.documentElement.style.setProperty(toCssVar(key), value);
  });
};

type SetThemeOptions = {
  palette?: ThemePalette;
  syncServer?: boolean;
};

type ThemeContextValue = {
  themeId: string;
  currentTheme: ThemePalette;
  setTheme: (themeId: string) => void;
  themes: ThemePalette[];
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated, isGuest } = useAuth();
  const [themes, setThemes] = useState<ThemePalette[]>(FALLBACK_THEMES);
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
  const lastRemoteTheme = useRef<string | null>(null);

  const themeMap = useMemo(() => new Map(themes.map((theme) => [theme.id, theme])), [themes]);

  const resolveTheme = useCallback(
    (nextId: string | null) => {
      const candidate = nextId ?? DEFAULT_THEME_ID;
      return themeMap.get(candidate) ?? FALLBACK_THEME_MAP.get(candidate) ?? FALLBACK_THEMES[0];
    },
    [themeMap],
  );

  const persistTheme = useCallback(
    (nextId: string, palette?: ThemePalette) => {
      const theme = palette ?? resolveTheme(nextId);
      window.localStorage.setItem(STORAGE_KEY, theme.id);
      applyThemePalette(theme);
      setThemeId(theme.id);
      return theme;
    },
    [resolveTheme],
  );

  const setTheme = useCallback(
    (nextId: string, options: SetThemeOptions = {}) => {
      const theme = persistTheme(nextId, options.palette);
      if ((options.syncServer ?? true) && isAuthenticated && !isGuest) {
        apiClient.updateUserThemePreference(theme.id)
          .then((remote) => {
            if (!remote) {
              return;
            }
            setThemes((prev) => {
              const exists = prev.some((item) => item.id === remote.id);
              if (exists) {
                return prev.map((item) => (item.id === remote.id ? remote : item));
              }
              return [...prev, remote];
            });
            persistTheme(remote.id, remote);
          })
          .catch(() => {});
      }
    },
    [isAuthenticated, isGuest, persistTheme],
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    persistTheme(stored ?? DEFAULT_THEME_ID);
  }, [persistTheme, themes]);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .fetchThemes()
      .then((remote) => {
        if (cancelled || remote.length === 0) {
          return;
        }
        setThemes((prev) => {
          const suffix = prev.filter((theme) => !remote.some((item) => item.id === theme.id));
          return [...remote, ...suffix];
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user || !isAuthenticated || isGuest) {
      lastRemoteTheme.current = null;
      return;
    }

    let cancelled = false;
    apiClient
      .fetchUserTheme()
      .then((remote) => {
        if (cancelled || !remote) {
          return;
        }

        if (lastRemoteTheme.current === remote.id) {
          return;
        }

        lastRemoteTheme.current = remote.id;
        setThemes((prev) => {
          const exists = prev.some((item) => item.id === remote.id);
          if (exists) {
            return prev.map((item) => (item.id === remote.id ? remote : item));
          }
          return [...prev, remote];
        });
        persistTheme(remote.id, remote);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isGuest, persistTheme, user?.id]);

  const value = useMemo(
    () => ({
      themeId,
      currentTheme: resolveTheme(themeId),
      setTheme,
      themes,
    }),
    [resolveTheme, setTheme, themeId, themes],
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
