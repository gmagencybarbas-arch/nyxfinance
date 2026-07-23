"use client";

import { useEffect, useState } from "react";
import { useReducedMotion, motion } from "framer-motion";

const MIN_MS = 2800;

/**
 * Tela de boot do chat: espera assets/assistente e garante ~3s de presença.
 */
export function NyxBootScreen({
  ready,
  onDone,
}: {
  ready: boolean;
  onDone: () => void;
}) {
  const reduced = useReducedMotion() ?? false;
  const [progress, setProgress] = useState(0);
  const [started] = useState(() => Date.now());

  useEffect(() => {
    if (reduced) {
      if (ready) onDone();
      return;
    }

    let raf = 0;
    let doneTimer: number | undefined;

    const tick = () => {
      const elapsed = Date.now() - started;
      const t = Math.min(1, elapsed / MIN_MS);
      const eased = 1 - Math.pow(1 - t, 2.4);
      const cap = ready ? 100 : 92;
      setProgress(Math.round(Math.min(cap, eased * 100)));

      if (ready && elapsed >= MIN_MS) {
        setProgress(100);
        doneTimer = window.setTimeout(onDone, 160);
        return;
      }
      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(raf);
      if (doneTimer) window.clearTimeout(doneTimer);
    };
  }, [ready, onDone, reduced, started]);

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-6 bg-[var(--background)] px-8"
      role="status"
      aria-live="polite"
      aria-label="Ligando motores da Nyx"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(139,92,246,0.18), transparent 70%)",
        }}
      />

      <div className="relative text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/70">
          Nyx
        </p>
        <p className="mt-2 text-lg font-medium text-white sm:text-xl">
          Ligando motores da Nyx…
        </p>
      </div>

      <div className="relative w-full max-w-[240px]">
        <div className="h-1 overflow-hidden rounded-full bg-white/[0.08]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-emerald-300"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.12, ease: "linear" }}
          />
        </div>
        <p className="mt-2 text-center text-[11px] tabular-nums text-white/35">
          {progress}%
        </p>
      </div>
    </div>
  );
}
