"use client";

import { Volume2, VolumeX } from "lucide-react";

type NyxSoundToggleProps = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  className?: string;
};

/**
 * Toggle discreto “Som da Nyx”.
 */
export function NyxSoundToggle({ enabled, onChange, className = "" }: NyxSoundToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`group inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white/55 backdrop-blur-md transition hover:border-violet-400/30 hover:text-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 ${className}`}
      aria-label={enabled ? "Desativar som da Nyx" : "Ativar som da Nyx"}
      aria-pressed={enabled}
    >
      {enabled ? (
        <Volume2 className="h-3 w-3 text-violet-300/90" aria-hidden />
      ) : (
        <VolumeX className="h-3 w-3 text-white/40" aria-hidden />
      )}
      <span>Som {enabled ? "ligado" : "desligado"}</span>
    </button>
  );
}
