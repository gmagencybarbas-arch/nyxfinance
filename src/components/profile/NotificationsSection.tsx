"use client";

import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import { Bell, Wallet, BarChart3, AlertTriangle } from "lucide-react";
import { playToggleOnSound, playToggleOffSound } from "@/lib/sounds/uiSounds";
import type { NotificationSettings } from "./types";

const ITEMS: {
  id: keyof NotificationSettings;
  icon: typeof Bell;
  label: string;
}[] = [
  { id: "salaryReminder", icon: Wallet, label: "Lembrete de salário" },
  { id: "expenseReminders", icon: Bell, label: "Lembretes de despesas" },
  { id: "weeklySummary", icon: BarChart3, label: "Resumo semanal" },
  { id: "highSpendingAlert", icon: AlertTriangle, label: "Alerta de gastos altos" },
];

const STORAGE_KEY = "nyx_notification_settings";

function loadStored(): NotificationSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? (JSON.parse(s) as NotificationSettings) : null;
  } catch {
    return null;
  }
}

function saveStored(v: NotificationSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
  } catch {
    /* noop */
  }
}

interface NotificationsSectionProps {
  value: NotificationSettings;
  onChange: (v: NotificationSettings) => void;
}

function NotificationsSectionBase({ value, onChange }: NotificationsSectionProps) {
  const handleToggle = useCallback(
    (id: keyof NotificationSettings) => {
      const willBeOn = !value[id];
      if (willBeOn) playToggleOnSound();
      else playToggleOffSound();
      const next = { ...value, [id]: willBeOn };
      onChange(next);
      saveStored(next);
    },
    [value, onChange]
  );

  return (
    <motion.div
      className="dashboard-card dashboard-card-glow relative overflow-hidden p-4 sm:p-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.14 }}
    >
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">
        Notificações inteligentes
      </h3>
      <div className="space-y-2">
        {ITEMS.map((item, i) => {
          const Icon = item.icon;
          const checked = value[item.id];
          return (
            <motion.div
              key={item.id}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[var(--muted)]/30 transition-colors"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.16 + i * 0.02 }}
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--muted)] flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-[var(--muted-foreground)]" />
              </div>
              <span className="flex-1 text-sm font-medium text-[var(--foreground)]">
                {item.label}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => handleToggle(item.id)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  checked ? "bg-[var(--nyx-gradient-start)]" : "bg-[var(--muted)]"
                }`}
              >
                <motion.span
                  className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                  animate={{ x: checked ? 22 : 4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              </button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export const NotificationsSection = memo(NotificationsSectionBase);
