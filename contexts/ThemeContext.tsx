import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch, isApiConfigured } from "@/lib/api";

const THEME_KEY = "inself-theme";

export type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
  isDark: false,
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [hydrated, setHydrated] = useState(false);

  const isDark = theme === "dark";

  const applyTheme = useCallback(
    async (next: Theme) => {
      setThemeState(next);
      Appearance.setColorScheme(next);
      if (isApiConfigured()) {
        await apiFetch("/settings", { method: "PATCH", body: { theme: next } });
      }
      await AsyncStorage.setItem(THEME_KEY, next);
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isApiConfigured()) {
        const { data } = await apiFetch<{ theme?: string }>("/settings");
        const next: Theme = data?.theme === "dark" || data?.theme === "light" ? data.theme : "light";
        if (!cancelled) {
          setThemeState(next);
          Appearance.setColorScheme(next);
        }
        setHydrated(true);
        return;
      }
      const stored = await AsyncStorage.getItem(THEME_KEY);
      const next: Theme = stored === "dark" || stored === "light" ? stored : "light";
      if (!cancelled) {
        setThemeState(next);
        Appearance.setColorScheme(next);
      }
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setTheme = useCallback(
    (t: Theme) => {
      applyTheme(t);
    },
    [applyTheme]
  );

  const toggleTheme = useCallback(() => {
    applyTheme(theme === "dark" ? "light" : "dark");
  }, [theme, applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}
