"use client";

import { memo, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Copy, Share2, Gift, Check } from "lucide-react";

interface ReferralSectionProps {
  code: string;
  invitedCount: number;
  activatedCount: number;
  myTransactionsCount: number;
}

const REWARD_THRESHOLD = 10;

function ReferralSectionBase({
  code,
  invitedCount,
  activatedCount,
  myTransactionsCount,
}: ReferralSectionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback */
    }
  }, [code]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Nyx - Controle financeiro",
          text: `Use meu código NYX e ganhe 3 dias de Nyx Prime: ${code}`,
          url: window.location.origin,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  }, [code, handleCopy]);

  const progress = Math.min(100, (activatedCount / REWARD_THRESHOLD) * 50 + (myTransactionsCount >= REWARD_THRESHOLD ? 50 : 0));
  const canUnlock = activatedCount >= REWARD_THRESHOLD && myTransactionsCount >= REWARD_THRESHOLD;

  return (
    <motion.div
      className="dashboard-card dashboard-card-glow relative overflow-hidden p-4 sm:p-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.16 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[var(--nyx-gradient-start)]/20 flex items-center justify-center">
          <Gift className="w-5 h-5 text-[var(--nyx-gradient-start)]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            Indique amigos
          </h3>
          <p className="text-xs text-[var(--muted-foreground)]">
            Seu código: <span className="font-mono font-medium text-[var(--foreground)]">{code}</span>
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <motion.button
          type="button"
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
          whileTap={{ scale: 0.98 }}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-500" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copiar
            </>
          )}
        </motion.button>
        <motion.button
          type="button"
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-[var(--nyx-gradient-start)]/20 text-[var(--nyx-gradient-start)] hover:bg-[var(--nyx-gradient-start)]/30 transition-colors"
          whileTap={{ scale: 0.98 }}
        >
          <Share2 className="w-4 h-4" />
          Compartilhar
        </motion.button>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-xs">
          <span className="text-[var(--muted-foreground)]">Progresso</span>
          <span className="text-[var(--foreground)] font-medium">
            {activatedCount}/{REWARD_THRESHOLD} indicados ativos
          </span>
        </div>
        <div className="h-2 rounded-full bg-[var(--muted)] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
        Quando um indicado fizer <strong>≥{REWARD_THRESHOLD} lançamentos</strong>{" "}
        e você também fizer <strong>≥{REWARD_THRESHOLD} lançamentos</strong>,{" "}
        ambos ganham <strong className="text-[var(--nyx-gradient-start)]">3 dias de Nyx Prime</strong>.
        {canUnlock && (
          <span className="block mt-2 text-emerald-500 font-medium">
            Parabéns! Você desbloqueou a recompensa.
          </span>
        )}
      </p>
    </motion.div>
  );
}

export const ReferralSection = memo(ReferralSectionBase);
