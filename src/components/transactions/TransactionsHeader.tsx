"use client";

import { motion } from "framer-motion";

interface TransactionsHeaderProps {
  onFilterClick: () => void;
}

export function TransactionsHeader({ onFilterClick }: TransactionsHeaderProps) {
  return (
    <motion.header
      className="sticky top-0 z-10 bg-[var(--background)]/90 backdrop-blur border-b border-[var(--border)] -mx-4 px-4 py-4 sm:-mx-6 sm:px-6 md:static md:border-0 md:bg-transparent md:backdrop-blur-none"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[var(--foreground)]">
          Lançamentos
        </h1>
        <motion.button
          type="button"
          onClick={onFilterClick}
          className="w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--muted)]/60 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--nyx-gradient-start)]/40 hover:shadow-[0_0_12px_rgba(167,139,250,0.1)] transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Filtrar período"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
        </motion.button>
      </div>
    </motion.header>
  );
}
