"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Lock } from "lucide-react";

export function AnalysisTab() {
  return (
    <motion.div
      className="relative rounded-2xl overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative blur-md select-none pointer-events-none">
        <div className="h-64 rounded-2xl bg-[var(--muted)]/40 border border-[var(--border)]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-4 p-6 opacity-30">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-[var(--muted)]" />
            ))}
          </div>
        </div>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--background)]/70 backdrop-blur-sm">
        <motion.div
          className="flex flex-col items-center text-center px-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)] mb-4 shadow-[0_0_24px_rgba(167,139,250,0.3)]">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1">
            Nyx Prime
          </h3>
          <p className="text-sm text-[var(--muted-foreground)] mb-4 max-w-xs">
            Análise inteligente com IA. Previsões, insights e recomendações personalizadas.
          </p>
          <Link
            href="/nyx"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)] px-5 py-3 text-sm font-medium text-white shadow-[0_0_20px_rgba(167,139,250,0.3)] hover:shadow-[0_0_28px_rgba(167,139,250,0.4)] transition-shadow"
          >
            <Lock className="w-4 h-4" />
            Conhecer Nyx Prime
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
