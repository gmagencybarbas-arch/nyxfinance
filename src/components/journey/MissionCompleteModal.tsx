"use client";

import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui";
import type { JourneyTrackNode } from "@/lib/journey/types";

type Mission = Extract<JourneyTrackNode, { kind: "mission" }>;

export function MissionCompleteModal({
  mission,
  open,
  progressLabel,
  onContinue,
  onShare,
  onViewJourney,
}: {
  mission: Mission | null;
  open: boolean;
  progressLabel: string;
  onContinue: () => void;
  onShare: () => void;
  onViewJourney: () => void;
}) {
  const reduced = useReducedMotion() ?? false;
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && mission && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-black/50"
            onClick={onContinue}
          />
          <motion.div
            role="dialog"
            aria-modal
            className="relative z-10 w-full max-w-sm rounded-3xl border border-emerald-200/50 bg-[var(--card)] p-5 text-center shadow-2xl dark:border-emerald-500/20"
            initial={reduced ? false : { scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            {!reduced ? (
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl" aria-hidden>
                {[...Array(12)].map((_, i) => (
                  <span
                    key={i}
                    className="absolute h-1.5 w-1.5 rounded-full bg-amber-300/80"
                    style={{
                      left: `${8 + (i * 7) % 84}%`,
                      top: `${10 + (i * 11) % 70}%`,
                      opacity: 0.7,
                    }}
                  />
                ))}
              </div>
            ) : null}
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              Missão concluída!
            </p>
            <h2 className="mt-1 text-xl font-bold text-[var(--foreground)]">
              {mission.title}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {progressLabel}
            </p>
            <div className="relative mt-5 flex flex-col gap-2">
              <Button type="button" variant="primary" fullWidth onClick={onContinue}>
                Continuar
              </Button>
              <Button type="button" variant="secondary" fullWidth onClick={onShare}>
                Compartilhar
              </Button>
              <Button type="button" variant="ghost" fullWidth onClick={onViewJourney}>
                Ver Jornada
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
