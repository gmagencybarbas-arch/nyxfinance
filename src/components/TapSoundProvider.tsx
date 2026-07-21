"use client";

import { useEffect } from "react";
import { playSoftTapSound } from "@/lib/sounds/uiSounds";

export function TapSoundProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactive = target.closest(
        "button, [role='button'], [role='switch'], a[href]"
      );
      if (interactive && !(interactive as HTMLElement).hasAttribute("data-no-tap-sound")) {
        playSoftTapSound();
      }
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return <>{children}</>;
}
