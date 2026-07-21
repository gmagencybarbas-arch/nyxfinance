"use client";

import { motion, useReducedMotion } from "framer-motion";
import { NyxAlphaAvatar } from "./NyxAlphaAvatar";
import type { NyxAvatarStageProps } from "./types";

/**
 * Palco da Nyx alfa: ambiente integrado, ledge e personagem ancorada.
 */
export function NyxAvatarStage({
  state,
  scrollShrink = 0,
  compact = false,
  className = "",
  statusLabel,
  controls,
}: NyxAvatarStageProps) {
  const reduced = useReducedMotion() ?? false;
  const particleCount = compact ? 0 : reduced ? 0 : 6;

  return (
    <div
      className={`relative flex h-full min-h-0 w-full items-end overflow-visible ${
        compact ? "justify-center" : "justify-end"
      } ${className}`}
      data-nyx-visual={state}
    >
      {/* Ambiente — sem moldura */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {/* Halo roxo atrás da cabeça */}
        <div
          className={`absolute rounded-full opacity-50 blur-[90px] ${
            compact
              ? "left-1/2 top-[8%] h-[48%] w-[70%] -translate-x-1/2"
              : "right-[8%] top-[6%] h-[52%] w-[78%]"
          }`}
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.42) 0%, transparent 68%)",
          }}
        />
        {/* Glow verde de baixo */}
        <div
          className={`absolute rounded-full opacity-40 blur-[80px] ${
            compact
              ? "bottom-[2%] left-1/2 h-[42%] w-[80%] -translate-x-1/2"
              : "bottom-[4%] right-[-5%] h-[48%] w-[85%]"
          }`}
          style={{
            background: "radial-gradient(circle, rgba(52,211,153,0.28) 0%, transparent 70%)",
          }}
        />
        {/* Radial suave */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background: compact
              ? "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(167,139,250,0.08), transparent 70%)"
              : "radial-gradient(ellipse 75% 65% at 72% 42%, rgba(167,139,250,0.1), transparent 72%)",
          }}
        />
        {/* Grid tecnológico quase invisível */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.55) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.55) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            maskImage: compact
              ? "radial-gradient(ellipse 80% 70% at 50% 50%, black 5%, transparent 75%)"
              : "radial-gradient(ellipse 70% 65% at 75% 45%, black 8%, transparent 78%)",
          }}
        />
        {/* Vinheta */}
        <div
          className="absolute inset-0"
          style={{
            background: compact
              ? "radial-gradient(ellipse 90% 80% at 50% 40%, transparent 40%, rgba(0,0,0,0.35) 100%)"
              : "radial-gradient(ellipse 85% 90% at 80% 50%, transparent 35%, rgba(0,0,0,0.45) 100%)",
          }}
        />
        {/* Linhas finas de dados */}
        {!compact && !reduced && (
          <>
            <motion.div
              className="absolute right-[18%] top-[22%] h-px w-[28%] origin-right bg-gradient-to-l from-violet-400/25 to-transparent"
              animate={{ opacity: [0.15, 0.4, 0.15], scaleX: [0.85, 1, 0.85] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute right-[12%] top-[31%] h-px w-[18%] origin-right bg-gradient-to-l from-emerald-400/20 to-transparent"
              animate={{ opacity: [0.1, 0.35, 0.1], scaleX: [0.7, 1, 0.7] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
            />
          </>
        )}
        {Array.from({ length: particleCount }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-white/25"
            style={{
              left: `${48 + ((i * 9) % 42)}%`,
              top: `${14 + ((i * 13) % 50)}%`,
            }}
            animate={{ opacity: [0.1, 0.4, 0.1], y: [0, -8, 0] }}
            transition={{
              duration: 4 + (i % 3),
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Status + som */}
      {(statusLabel || controls) && !compact && (
        <div className="pointer-events-auto absolute right-5 top-5 z-20 flex flex-col items-end gap-2">
          {statusLabel && (
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/45">
              <span className="text-violet-300/80">Nyx</span>
              <span className="mx-1.5 text-white/20">·</span>
              <span>{statusLabel}</span>
            </p>
          )}
          {controls}
        </div>
      )}

      {/* Personagem + ledge ancorada na base da imagem */}
      <div
        className={`relative z-[1] flex w-full items-end ${
          compact
            ? "max-h-full justify-center"
            : "h-[74%] max-h-[min(78vh,820px)] -translate-y-[200px] justify-end pr-2 pl-[4%]"
        }`}
      >
        <div
          className={`relative ${
            compact
              ? "mx-auto w-[88%] max-w-[340px]"
              : "mr-[-2%] h-full w-[118%] max-w-none -translate-x-[6%]"
          }`}
        >
          <NyxAlphaAvatar
            state={state}
            scrollShrink={scrollShrink}
            compact={compact}
            className="h-full w-full"
          />

          {/* Ledge: ~10% acima da base da imagem (segue o sprite) */}
          {!compact && (
            <div
              className="pointer-events-none absolute bottom-[10%] left-[2%] right-[6%] z-[2]"
              aria-hidden
            >
              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-violet-300/35" />
              <div
                className="mt-px h-[3px] w-full rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(20,16,28,0.85) 18%, rgba(30,24,42,0.95) 55%, rgba(167,139,250,0.35) 88%, transparent 100%)",
                  boxShadow: "0 0 18px rgba(139,92,246,0.22), 0 4px 20px rgba(0,0,0,0.35)",
                }}
              />
              <div className="mx-auto mt-1 h-px w-[55%] bg-gradient-to-r from-transparent via-violet-400/25 to-transparent blur-[1px]" />
            </div>
          )}
        </div>
      </div>

      {compact && (
        <div
          className="pointer-events-none absolute inset-x-[12%] bottom-0 z-[2] h-px bg-gradient-to-r from-transparent via-violet-300/30 to-transparent"
          aria-hidden
        />
      )}
    </div>
  );
}
