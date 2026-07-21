"use client";

import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui";

interface UnlockRevealProps {
  open: boolean;
  name: string;
  preview: string;
  phrase: string;
  onUseNow: () => void;
  onLater: () => void;
}

/**
 * Revelação discreta pós-desbloqueio.
 * Não abre sozinha durante ações financeiras — o caller controla.
 */
export function UnlockReveal({
  open,
  name,
  preview,
  phrase,
  onUseNow,
  onLater,
}: UnlockRevealProps) {
  const reduced = useReducedMotion() ?? false;
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={onLater}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby="unlock-reveal-title"
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[var(--card)] p-5 shadow-2xl"
            initial={reduced ? false : { opacity: 0.96, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.22 }}
          >
            <div className="mx-auto mb-4 h-40 w-28 overflow-hidden rounded-xl border border-white/10 bg-[#12081F]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt=""
                className="h-full w-full object-cover object-top"
                width={112}
                height={160}
              />
            </div>
            <h2
              id="unlock-reveal-title"
              className="text-center text-lg font-semibold text-[var(--foreground)]"
            >
              {name}
            </h2>
            <p className="mt-2 text-center text-sm text-[var(--muted-foreground)]">
              {phrase}
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Button type="button" variant="primary" fullWidth onClick={onUseNow}>
                Usar agora
              </Button>
              <Button type="button" variant="ghost" fullWidth onClick={onLater}>
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
