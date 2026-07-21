"use client";

import { memo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { User, Camera } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";

interface UserHeaderCardProps {
  isPrime?: boolean;
  onAvatarTap?: () => void;
  onNameTap?: () => void;
}

function UserHeaderCardBase({
  isPrime,
  onAvatarTap,
  onNameTap,
}: UserHeaderCardProps) {
  const { user } = useAuth();
  const profile = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarUrl = profile?.avatarUrl ?? user?.user_metadata?.avatar_url ?? null;
  const displayName =
    profile?.displayName ??
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "Usuário";
  const email = user?.email ?? null;

  const handleAvatarClick = useCallback(() => {
    if (onAvatarTap) {
      onAvatarTap();
      return;
    }
    fileInputRef.current?.click();
  }, [onAvatarTap]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        profile?.setAvatarUrl(url);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [profile]
  );

  return (
    <motion.div
      className="relative rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(167,139,250,0.06) 0%, transparent 70%)",
        }}
      />
      <div className="relative flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          aria-label="Alterar foto"
        />
        <motion.button
          type="button"
          onClick={handleAvatarClick}
          className="relative flex-shrink-0 w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--border)] bg-[var(--muted)] ring-2 ring-transparent hover:ring-[var(--nyx-gradient-start)]/50 transition-all group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-10 h-10 text-[var(--muted-foreground)]" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-8 h-8 text-white" />
          </div>
        </motion.button>

        <div className="flex-1 min-w-0">
          <motion.button
            type="button"
            onClick={onNameTap}
            className="block text-left w-full hover:opacity-90 transition-opacity"
          >
            <p className="text-lg font-semibold text-[var(--foreground)] truncate">
              {displayName}
            </p>
          </motion.button>
          {email && (
            <p className="text-sm text-[var(--muted-foreground)] truncate mt-0.5">
              {email}
            </p>
          )}
          {isPrime && (
            <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-[var(--nyx-gradient-start)]/20 to-[var(--nyx-gradient-end)]/20 text-[var(--nyx-gradient-start)] border border-[var(--nyx-gradient-start)]/30">
              Nyx Prime
            </span>
          )}
        </div>
      </div>
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-30 pointer-events-none"
        style={{ background: "var(--nyx-gradient-start)" }}
      />
    </motion.div>
  );
}

export const UserHeaderCard = memo(UserHeaderCardBase);
