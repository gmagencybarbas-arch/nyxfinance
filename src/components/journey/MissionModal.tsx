"use client";

import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui";
import type { JourneyTrackNode } from "@/lib/journey/types";

type Mission = Extract<JourneyTrackNode, { kind: "mission" }>;

const STATUS_LABEL: Record<Mission["status"], string> = {
  completed: "Concluída",
  current: "Em andamento",
  available: "Disponível",
  locked: "Bloqueada",
};

export function MissionModal({
  mission,
  open,
  onClose,
  onPrimary,
  ctaLabel,
  collectionProgress,
}: {
  mission: Mission | null;
  open: boolean;
  onClose: () => void;
  onPrimary: () => void;
  ctaLabel: string;
  collectionProgress?: string;
}) {
  const reduced = useReducedMotion() ?? false;
  if (typeof document === "undefined") return null;

  const locked = mission?.status === "locked";
  const done = mission?.status === "completed";

  return createPortal(
    <AnimatePresence>
      {open && mission && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby="mission-modal-title"
            className="relative z-10 w-full max-w-md rounded-t-3xl border border-violet-400/20 bg-gradient-to-b from-[#1e1233] to-[#150d26] p-5 shadow-2xl sm:rounded-3xl"
            initial={reduced ? false : { y: 40, opacity: 0.96 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
            <p className="text-xs font-bold uppercase tracking-widest text-violet-300">
              {STATUS_LABEL[mission.status]}
            </p>
            <h2
              id="mission-modal-title"
              className="mt-1 text-2xl font-extrabold text-white"
            >
              {mission.title}
            </h2>
            <p className="mt-2 text-sm text-violet-100/70">
              {mission.description}
            </p>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.05] p-3">
                <dt className="text-[11px] text-violet-100/50">Progresso</dt>
                <dd className="font-bold text-white">
                  {mission.progressCurrent} de {mission.progressTarget}
                </dd>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.05] p-3">
                <dt className="text-[11px] text-violet-100/50">Coleção</dt>
                <dd className="font-bold text-white">
                  {collectionProgress ?? mission.chapterName}
                </dd>
              </div>
            </dl>

            {locked ? (
              <p className="mt-3 rounded-xl bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
                Desbloqueie a Eva na Jornada antes desta missão.
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-2">
              {!done && !locked ? (
                <Button type="button" variant="primary" fullWidth onClick={onPrimary}>
                  {ctaLabel}
                </Button>
              ) : null}
              <Button type="button" variant="ghost" fullWidth onClick={onClose}>
                Fechar
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
