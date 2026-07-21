"use client";

import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui";

export function ShareActionsSheet({
  open,
  busy,
  error,
  previewUrl,
  onClose,
  onNativeShare,
  onDownload,
}: {
  open: boolean;
  busy: boolean;
  error: string | null;
  previewUrl: string | null;
  onClose: () => void;
  onNativeShare: () => void;
  onDownload: () => void;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            aria-label="Fechar"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-label="Compartilhar conquista"
            className="relative z-10 w-full max-w-sm rounded-t-3xl bg-[var(--card)] p-5 shadow-2xl sm:rounded-3xl"
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 24 }}
          >
            <h2 className="text-lg font-bold text-[var(--foreground)]">
              Compartilhar
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Card pronto para WhatsApp, Stories ou galeria.
            </p>

            <div className="mt-4 flex justify-center">
              {busy ? (
                <div className="h-48 w-28 animate-pulse rounded-xl bg-black/10 dark:bg-white/10" />
              ) : previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Prévia do card"
                  className="h-52 w-auto rounded-xl border border-black/10 shadow-md dark:border-white/10"
                />
              ) : null}
            </div>

            {error ? (
              <p className="mt-3 text-sm text-rose-500">{error}</p>
            ) : null}

            <div className="mt-4 flex flex-col gap-2">
              <Button
                type="button"
                variant="primary"
                fullWidth
                disabled={busy || !previewUrl}
                onClick={onNativeShare}
              >
                Compartilhar
              </Button>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                disabled={busy || !previewUrl}
                onClick={onDownload}
              >
                Salvar imagem
              </Button>
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
