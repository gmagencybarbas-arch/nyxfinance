"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Lock, Sparkles } from "lucide-react";
import type { StoreItem } from "@/lib/assistant/types";

interface StoreItemCardProps {
  item: StoreItem;
  focused: boolean;
  onFocus: () => void;
  compact?: boolean;
}

function statusLabel(item: StoreItem): string {
  if (item.status === "in_use") return "Em uso";
  if (item.status === "coming_soon") return "Em breve";
  if (item.status === "locked") return "Bloqueada";
  if (item.status === "unlocked" || item.status === "selected") return "Disponível";
  return "Indisponível";
}

export function StoreItemCard({
  item,
  focused,
  onFocus,
  compact = false,
}: StoreItemCardProps) {
  const reduced = useReducedMotion() ?? false;
  const locked = item.status === "locked" || item.status === "coming_soon";

  return (
    <motion.button
      type="button"
      onClick={onFocus}
      aria-pressed={focused}
      aria-label={`${item.name}. ${statusLabel(item)}`}
      className={`group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] ${
        focused
          ? "z-10 border-violet-400/45 bg-[var(--card)] shadow-[0_0_28px_rgba(139,92,246,0.18)]"
          : "border-white/[0.07] bg-[var(--card)]/70 hover:border-white/15"
      }`}
      animate={
        reduced
          ? undefined
          : {
              scale: focused ? 1.04 : 0.96,
              y: focused ? -6 : 0,
            }
      }
      transition={{ duration: 0.22 }}
      whileTap={reduced ? undefined : { scale: focused ? 1.02 : 0.94 }}
    >
      <div
        className={`relative w-full overflow-hidden bg-gradient-to-b from-[#1a1028] to-[#0c0814] ${
          compact ? "aspect-[3/4] min-h-[220px]" : "aspect-[3/4] min-h-[280px]"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.preview}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover object-top transition duration-300 ${
            locked ? "scale-105 blur-[2px] opacity-70" : "opacity-95"
          }`}
          width={480}
          height={640}
          loading="lazy"
          decoding="async"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {locked && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/50 px-2 py-1 text-[10px] font-medium text-[var(--muted-foreground)] backdrop-blur">
            <Lock className="h-3 w-3" aria-hidden />
            {item.status === "coming_soon" ? "Em breve" : "Bloqueada"}
          </span>
        )}
        {item.status === "in_use" && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-1 text-[10px] font-medium text-emerald-300 backdrop-blur">
            <Sparkles className="h-3 w-3" aria-hidden />
            Em uso
          </span>
        )}
      </div>

      <div className="relative z-10 space-y-0.5 px-3.5 py-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          {item.type === "character" ? "Personagem" : "Visual"}
        </p>
        <p className="truncate text-sm font-semibold text-[var(--foreground)]">
          {item.name}
        </p>
        <p className="text-[11px] text-[var(--muted-foreground)]">
          {statusLabel(item)}
        </p>
      </div>
    </motion.button>
  );
}
