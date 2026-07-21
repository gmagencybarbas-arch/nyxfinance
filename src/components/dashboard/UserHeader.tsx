"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { User } from "lucide-react";
import { useProfile } from "@/contexts/ProfileContext";

interface UserHeaderProps {
  name?: string | null;
  avatarUrl?: string | null;
}

export function UserHeader({ name, avatarUrl }: UserHeaderProps) {
  const profile = useProfile();
  const displayAvatar = profile?.avatarUrl ?? avatarUrl;
  const displayName = profile?.displayName ?? name ?? "Usuário";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3"
    >
      <Link href="/profile" className="flex-shrink-0">
        <motion.div
          className="w-12 h-12 rounded-full overflow-hidden border-2 border-[var(--border)] bg-[var(--muted)] flex items-center justify-center ring-2 ring-transparent hover:ring-[var(--nyx-gradient-start)]/40 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-6 h-6 text-[var(--muted-foreground)]" />
          )}
        </motion.div>
      </Link>
      <div>
        <p className="text-sm text-[var(--muted-foreground)]">Olá,</p>
        <p className="font-semibold text-[var(--foreground)]">{displayName}</p>
      </div>
    </motion.div>
  );
}
