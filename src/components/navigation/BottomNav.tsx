"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Store,
  MessageCircle,
  User,
  CalendarRange,
  Map,
} from "lucide-react";

const ITEMS = [
  { href: "/planejamento", icon: CalendarRange, label: "Plano" },
  { href: "/jornada", icon: Map, label: "Jornada" },
  { href: "/nyx", icon: MessageCircle, label: "Nyx", isCenter: true },
  { href: "/loja", icon: Store, label: "Loja" },
  { href: "/profile", icon: User, label: "Perfil" },
];

const HIDDEN_PATHS = ["/login", "/register", "/auth", "/onboarding"];

export function BottomNav() {
  const pathname = usePathname();
  const isHidden = HIDDEN_PATHS.some((p) => pathname.startsWith(p));

  if (isHidden) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-[env(safe-area-inset-bottom)]"
      role="navigation"
      aria-label="Navegação principal"
    >
      <motion.div
        className="mx-4 mb-2 rounded-2xl border border-white/[0.06] bg-[var(--background-secondary)]/90 backdrop-blur-xl shadow-[0_0_24px_rgba(167,139,250,0.05)]"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {ITEMS.map((item) => {
            const isActive =
              item.href === "/nyx"
                ? pathname === "/nyx"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            if (item.isCenter) {
              return (
                <Link key={item.href} href={item.href} className="relative -mt-7">
                  <motion.div
                    className="relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)] shadow-[0_0_20px_rgba(167,139,250,0.3),0_0_40px_rgba(34,197,94,0.1)]"
                    whileHover={{ scale: 1.06, y: -2 }}
                    whileTap={{ scale: 0.94 }}
                    animate={
                      isActive
                        ? {
                            boxShadow: [
                              "0 0 20px rgba(167,139,250,0.3), 0 0 40px rgba(34,197,94,0.1)",
                              "0 0 28px rgba(167,139,250,0.4), 0 0 48px rgba(34,197,94,0.18)",
                              "0 0 20px rgba(167,139,250,0.3), 0 0 40px rgba(34,197,94,0.1)",
                            ],
                            y: [0, -2, 0],
                          }
                        : { y: 0 }
                    }
                    transition={{
                      boxShadow: { duration: 2.5, repeat: Infinity },
                      y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                    }}
                  >
                    <motion.div
                      className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white/80"
                      animate={{
                        opacity: [0.5, 1, 0.5],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    <Icon className="relative w-6 h-6 text-white" strokeWidth={2} />
                  </motion.div>
                </Link>
              );
            }

            return (
              <Link key={item.href} href={item.href} className="flex-1 flex justify-center">
                <motion.div
                  className="relative flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl min-w-[48px]"
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <Icon
                    className={`w-5 h-5 transition-all duration-200 ${
                      isActive
                        ? "text-[var(--nyx-gradient-start)] drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]"
                        : "text-[var(--muted-foreground)]"
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span
                    className={`text-[10px] font-medium transition-colors ${
                      isActive ? "text-[var(--nyx-gradient-start)]" : "text-[var(--muted-foreground)]"
                    }`}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-gradient-to-r from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)]"
                      layoutId="nav-glow"
                      initial={false}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </nav>
  );
}
