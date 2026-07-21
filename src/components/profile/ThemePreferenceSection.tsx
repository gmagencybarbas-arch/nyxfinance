"use client";

import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { playToggleOnSound, playToggleOffSound } from "@/lib/sounds/uiSounds";
import type { ThemeMode } from "@/contexts/ThemeContext";

const SPRING = { type: "spring" as const, stiffness: 400, damping: 30 };

function ThemePreferenceSectionBase() {
  const themeContext = useTheme();
  const theme = themeContext?.theme ?? "dark";
  const setTheme = themeContext?.setTheme;
  const isDark = theme === "dark";

  const handleToggle = useCallback(() => {
    const next: ThemeMode = isDark ? "light" : "dark";
    if (next === "dark") playToggleOffSound();
    else playToggleOnSound();
    setTheme?.(next);
  }, [isDark, setTheme]);

  return (
    <motion.div
      className="dashboard-card dashboard-card-glow relative overflow-hidden p-4 sm:p-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.12 }}
    >
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">
        Appearance
      </h3>
      <p className="text-xs text-[var(--muted-foreground)] mb-4">
        Dark or Light mode
      </p>
      <div className="flex items-center gap-3">
        <span className="flex-1 text-sm font-medium text-[var(--foreground)]">
          {isDark ? "Dark" : "Light"}
        </span>
        <button
          type="button"
          role="switch"
          aria-label={isDark ? "Usar tema claro" : "Usar tema escuro"}
          aria-checked={!isDark}
          onClick={handleToggle}
          className="relative w-12 h-7 rounded-full min-w-[3rem] min-h-[1.75rem] touch-manipulation active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
          style={{
            background: isDark
              ? "linear-gradient(135deg, var(--muted) 0%, var(--card) 100%)"
              : "linear-gradient(135deg, #e8eaf0 0%, #dde0e8 100%)",
            boxShadow: isDark
              ? "0 0 12px rgba(167, 139, 250, 0.2), inset 0 1px 0 rgba(255,255,255,0.06)"
              : "inset 0 1px 2px rgba(0,0,0,0.06)",
          }}
        >
          <motion.span
            className="absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md pointer-events-none"
            animate={{ x: isDark ? 22 : 4 }}
            transition={SPRING}
            style={{
              boxShadow: isDark
                ? "0 0 10px rgba(167, 139, 250, 0.35), 0 2px 4px rgba(0,0,0,0.2)"
                : "0 2px 4px rgba(0,0,0,0.12)",
            }}
          />
        </button>
      </div>
    </motion.div>
  );
}

export const ThemePreferenceSection = memo(ThemePreferenceSectionBase);
