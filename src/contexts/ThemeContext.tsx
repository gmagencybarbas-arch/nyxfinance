"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import { useProfile } from "@/contexts/ProfileContext";

const STORAGE_THEME = "nyx_theme";

export type ThemeMode = "dark" | "light";

export interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function loadStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  try {
    const s = localStorage.getItem(STORAGE_THEME);
    if (s === "light" || s === "dark") return s;
  } catch {
    /* noop */
  }
  return "dark";
}

function applyThemeToDom(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const profile = useProfile();
  const [theme, setThemeState] = useState<ThemeMode>("dark");

  useEffect(() => {
    const stored = loadStoredTheme();
    setThemeState(stored);
    applyThemeToDom(stored);
  }, []);

  useEffect(() => {
    const pref = profile?.profile?.themePreference;
    if (pref === "light" || pref === "dark") {
      setThemeState(pref);
      applyThemeToDom(pref);
      try {
        localStorage.setItem(STORAGE_THEME, pref);
      } catch {
        /* noop */
      }
    }
  }, [profile?.profile?.themePreference]);

  const setTheme = useCallback(
    (next: ThemeMode) => {
      setThemeState(next);
      applyThemeToDom(next);
      try {
        localStorage.setItem(STORAGE_THEME, next);
      } catch {
        /* noop */
      }
      profile?.updateProfile({ themePreference: next });
    },
    [profile]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      isDark: theme === "dark",
    }),
    [theme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  return ctx ?? null;
}
