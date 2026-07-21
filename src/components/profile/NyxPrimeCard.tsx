"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Crown } from "lucide-react";
import type { NyxPlan } from "./types";

interface NyxPrimeCardProps {
  plan: NyxPlan;
  onUpgrade?: () => void;
  onManage?: () => void;
}

function NyxPrimeCardBase({
  plan,
  onUpgrade,
  onManage,
}: NyxPrimeCardProps) {
  const isPrime = plan === "prime";

  return (
    <motion.div
      className="relative rounded-2xl border border-[var(--border)] overflow-hidden"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isPrime
            ? "linear-gradient(135deg, rgba(167,139,250,0.12) 0%, rgba(34,197,94,0.06) 100%)"
            : "linear-gradient(135deg, rgba(167,139,250,0.06) 0%, transparent 100%)",
        }}
      />
      <div className="relative p-5">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isPrime
                ? "bg-gradient-to-br from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)]"
                : "bg-[var(--muted)]"
            }`}
          >
            {isPrime ? (
              <Crown className="w-5 h-5 text-white" />
            ) : (
              <Sparkles className="w-5 h-5 text-[var(--muted-foreground)]" />
            )}
          </div>
          <div>
            <p className="font-semibold text-[var(--foreground)]">
              Nyx {isPrime ? "Prime" : "Free"}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {isPrime
                ? "Assinatura ativa com todos os benefícios"
                : "Desbloqueie insights avançados e mais"}
            </p>
          </div>
        </div>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          {isPrime
            ? "Insights com IA, análise de categorias, alertas personalizados e suporte prioritário."
            : "Análise detalhada por categoria, insights com Nyx IA e alertas inteligentes."}
        </p>
        <motion.button
          type="button"
          onClick={isPrime ? onManage : onUpgrade}
          className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all ${
            isPrime
              ? "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)]"
              : "bg-gradient-to-r from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-mid)] text-white hover:opacity-90"
          }`}
          whileTap={{ scale: 0.98 }}
        >
          {isPrime ? "Gerenciar assinatura" : "Fazer upgrade para Prime"}
        </motion.button>
      </div>
    </motion.div>
  );
}

export const NyxPrimeCard = memo(NyxPrimeCardBase);
