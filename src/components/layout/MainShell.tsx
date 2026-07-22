"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Padding inferior só quando o BottomNav fixed está ativo (não no chat /nyx). */
export function MainShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const chatMobileShell = pathname === "/nyx";

  return (
    <div
      className={
        chatMobileShell
          ? "md:pb-0"
          : "pb-[max(5rem,calc(4.5rem+env(safe-area-inset-bottom)))] md:pb-0"
      }
    >
      {children}
    </div>
  );
}
