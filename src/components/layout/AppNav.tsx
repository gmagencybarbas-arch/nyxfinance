"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function AppNav({ userEmail }: { userEmail?: string }) {
  const { signedIn } = useAuth();

  return (
    <header className="sticky top-0 z-10 hidden border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur md:block">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/nyx" className="shrink-0 text-lg font-semibold text-[var(--foreground)]">
          Mini-Nyx
        </Link>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
          {userEmail && (
            <span className="hidden max-w-[160px] truncate text-sm text-[var(--muted-foreground)] lg:inline">
              {userEmail}
            </span>
          )}
          {signedIn && (
            <>
              <Link
                href="/planejamento"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
              >
                Planejamento
              </Link>
              <Link
                href="/jornada"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
              >
                Jornada
              </Link>
              <Link
                href="/loja"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
              >
                Loja
              </Link>
              <Link
                href="/dashboard"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
              >
                Dashboard
              </Link>
              <Link
                href="/transactions"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
              >
                Transações
              </Link>
              <Link
                href="/profile"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
              >
                Perfil
              </Link>

              <motion.div
                className="relative ml-1"
                animate={{
                  scale: [1, 1.045, 1],
                  filter: [
                    "drop-shadow(0 0 0 rgba(167,139,250,0))",
                    "drop-shadow(0 0 12px rgba(167,139,250,0.55))",
                    "drop-shadow(0 0 0 rgba(167,139,250,0))",
                  ],
                }}
                transition={{
                  duration: 1.1,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 3.2,
                }}
              >
                <Link
                  href="/nyx"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--nyx-gradient-start)] via-violet-400 to-[var(--nyx-gradient-end)] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.35)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  />
                  <MessageCircle className="relative h-4 w-4" aria-hidden />
                  <span className="relative tracking-tight">Fale com NYX</span>
                </Link>
              </motion.div>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
