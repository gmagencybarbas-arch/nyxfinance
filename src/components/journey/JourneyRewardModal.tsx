"use client";

import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui";
import type { JourneyTrackNode } from "@/lib/journey/types";

type Reward = Extract<JourneyTrackNode, { kind: "reward" }>;

export function JourneyRewardModal({
  reward,
  open,
  onClose,
  onUseNow,
  onShare,
}: {
  reward: Reward | null;
  open: boolean;
  onClose: () => void;
  onUseNow: () => void;
  onShare: () => void;
}) {
  const reduced = useReducedMotion() ?? false;
  if (typeof document === "undefined") return null;

  const canUse =
    reward &&
    (reward.status === "claimed" || reward.status === "ready") &&
    Boolean(reward.skinId || reward.characterId);

  return createPortal(
    <AnimatePresence>
      {open && reward && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby="reward-modal-title"
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-t-3xl border border-amber-300/25 bg-gradient-to-b from-[#241536] to-[#150d26] p-5 shadow-[0_0_60px_rgba(251,191,36,0.15)] sm:rounded-3xl"
            initial={reduced ? false : { y: 32, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            {/* brilho dourado de fundo */}
            <div
              className="pointer-events-none absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-amber-400/15 blur-3xl"
              aria-hidden
            />
            <div className="relative mx-auto mb-4 h-48 w-36 overflow-hidden rounded-2xl border border-amber-300/25 bg-[#12081F] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={reward.preview}
                alt=""
                className="h-full w-full object-cover object-top"
                width={144}
                height={192}
              />
            </div>
            <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
              {reward.status === "locked"
                ? "Ainda bloqueada"
                : reward.status === "ready"
                  ? "Nova recompensa liberada"
                  : "Recompensa"}
            </p>
            <h2
              id="reward-modal-title"
              className="mt-1 text-center text-2xl font-extrabold text-white"
            >
              {reward.title}
              {reward.title === "Eva" ? " 💜" : ""}
            </h2>
            <p className="mt-2 text-center text-sm text-violet-100/70">
              {reward.phrase}
            </p>
            <div className="mt-5 flex flex-col gap-2">
              {canUse && reward.status !== "locked" ? (
                <Button type="button" variant="primary" fullWidth onClick={onUseNow}>
                  Usar agora
                </Button>
              ) : null}
              {reward.status !== "locked" ? (
                <Button type="button" variant="secondary" fullWidth onClick={onShare}>
                  Compartilhar
                </Button>
              ) : null}
              <Button type="button" variant="ghost" fullWidth onClick={onClose}>
                Depois
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
