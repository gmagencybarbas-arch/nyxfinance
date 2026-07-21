"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Wallet, MessageCircle } from "lucide-react";

export function TransactionsEmpty() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="w-20 h-20 rounded-2xl flex items-center justify-center bg-[var(--muted)]/60 border border-[var(--border)] mb-6"
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <Wallet className="w-10 h-10 text-[var(--muted-foreground)]" />
      </motion.div>
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
        Nenhum lançamento ainda
      </h3>
      <p className="text-sm text-[var(--muted-foreground)] max-w-xs mb-6">
        Comece registrando suas transações ou peça ajuda à Nyx para organizar suas finanças.
      </p>
      <Link
        href="/nyx"
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)] px-5 py-3 text-sm font-medium text-white shadow-[0_0_20px_rgba(167,139,250,0.25)] hover:shadow-[0_0_28px_rgba(167,139,250,0.35)] transition-shadow"
      >
        <MessageCircle className="w-4 h-4" />
        Falar com Nyx
      </Link>
    </motion.div>
  );
}
