"use client";

import { motion } from "framer-motion";

export function WelcomeStep() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold leading-tight tracking-tight text-[var(--foreground)] sm:text-3xl">
        Bem-vindo à
        <span className="bg-gradient-to-r from-emerald-400 via-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)] bg-clip-text text-transparent">
          {" "}
          Nyx
        </span>
        .
      </h1>
      <p className="text-base leading-relaxed text-[var(--muted-foreground)]">
        Não é uma planilha. É uma inteligência financeira pessoal que entende sua rotina, organiza
        seus gastos e mostra o que ainda está por vir.
      </p>
      <div className="flex flex-wrap gap-2 pt-2">
        {["Previsto", "Parcelas", "Contas fixas", "Saldo livre"].map((tag, i) => (
          <motion.span
            key={tag}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-[var(--foreground)]"
          >
            {tag}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}
