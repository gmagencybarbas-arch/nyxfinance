"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Mail, Key, Shield } from "lucide-react";

const ITEMS: Array<{
  id: string;
  icon: typeof Mail;
  label: string;
  subtitle?: string;
  onClick: () => void;
}> = [
  {
    id: "email",
    icon: Mail,
    label: "Alterar e-mail",
    onClick: () => {},
  },
  {
    id: "password",
    icon: Key,
    label: "Alterar senha",
    onClick: () => {},
  },
  {
    id: "2fa",
    icon: Shield,
    label: "Autenticação em dois fatores",
    subtitle: "Em breve",
    onClick: () => {},
  },
];

function SecuritySectionBase() {
  return (
    <motion.div
      className="dashboard-card dashboard-card-glow relative overflow-hidden p-4 sm:p-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.12 }}
    >
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">
        Segurança da conta
      </h3>
      <div className="space-y-1">
        {ITEMS.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[var(--muted)]/50 transition-colors text-left"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.14 + i * 0.02 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--muted)] flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-[var(--muted-foreground)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {item.label}
                </p>
                {item.subtitle && (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {item.subtitle}
                  </p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)] flex-shrink-0" />
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

export const SecuritySection = memo(SecuritySectionBase);
