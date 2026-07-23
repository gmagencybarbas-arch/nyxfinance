"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useNyxAssetPreload } from "@/hooks/useNyxAssetPreload";
import {
  NYX_SPRITE_HEIGHT,
  NYX_SPRITE_WIDTH,
  type NyxAlphaAvatarProps,
  type NyxVisualState,
} from "./types";

type MotionTarget = {
  x?: number | number[];
  y?: number | number[];
  scale?: number | number[];
  rotate?: number | number[];
};

function targetsFor(state: NyxVisualState, reduced: boolean): {
  animate: MotionTarget;
  transition: Record<string, unknown>;
} {
  if (reduced) {
    return {
      animate: { x: 0, y: 0, scale: 1, rotate: 0 },
      transition: { duration: 0.2 },
    };
  }

  switch (state) {
    case "typing":
      return {
        animate: { x: -5, y: 1, scale: 1.004, rotate: -1 },
        transition: { type: "spring", stiffness: 140, damping: 20 },
      };
    case "thinking":
      return {
        animate: {
          y: [0, -3, 0],
          scale: [1.008, 1.01, 1.008],
          rotate: [0, 0.4, 0],
        },
        transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
      };
    case "sucess":
      return {
        animate: {
          y: [0, -4, 0],
          scale: [1, 1.01, 1],
          rotate: [0, -0.5, 0],
        },
        transition: { duration: 3.8, repeat: Infinity, ease: "easeInOut" },
      };
    case "error":
      return {
        animate: {
          x: [0, -4, 4, -3, 2, 0],
          rotate: [0, -0.8, 0.8, -0.4, 0],
        },
        transition: { duration: 0.42, ease: "easeInOut" },
      };
    case "cigarro01":
      return {
        animate: { scale: [0.995, 1.008], y: [2, 0] },
        transition: { duration: 0.55, ease: "easeOut" },
      };
    case "cigarro02":
      return {
        animate: {
          y: [0, -2.5, 0],
          scale: [1, 1.004, 1],
          rotate: [0, 0.6, 0],
        },
        transition: { duration: 5.5, repeat: Infinity, ease: "easeInOut" },
      };
    case "master":
    default:
      return {
        animate: {
          y: [0, -2.5, 0],
          scale: [1, 1.006, 1],
          rotate: [0, -0.35, 0.25, 0],
        },
        transition: { duration: 4.6, repeat: Infinity, ease: "easeInOut" },
      };
  }
}

function glowFor(state: NyxVisualState): string {
  switch (state) {
    case "typing":
      return "rgba(167,139,250,0.38)";
    case "thinking":
      return "rgba(139,92,246,0.55)";
    case "sucess":
      return "rgba(52,211,153,0.48)";
    case "error":
      return "rgba(244,63,94,0.42)";
    case "cigarro01":
    case "cigarro02":
      return "rgba(167,139,250,0.18)";
    default:
      return "rgba(167,139,250,0.22)";
  }
}

export function NyxAlphaAvatar({
  state,
  scrollShrink = 0,
  compact = false,
  className = "",
}: NyxAlphaAvatarProps) {
  const reduced = useReducedMotion() ?? false;
  const { resolveSrc, ready } = useNyxAssetPreload();
  const src = resolveSrc(state);
  const [displaySrc, setDisplaySrc] = useState(src);
  const [prevSrc, setPrevSrc] = useState<string | null>(null);
  const [pumpKey, setPumpKey] = useState(0);
  const { animate, transition } = targetsFor(state, reduced);

  const shrink = Math.min(1, Math.max(0, scrollShrink));
  const opacityBoost = 1 - shrink * 0.22;
  const scaleBoost = 1 - shrink * 0.1;

  useEffect(() => {
    if (!src) {
      setDisplaySrc("");
      setPrevSrc(null);
      return;
    }
    if (src === displaySrc) return;
    setPrevSrc(displaySrc || null);
    setDisplaySrc(src);
    setPumpKey((k) => k + 1);
  }, [src, displaySrc]);

  const thinking = state === "thinking";

  if (!ready || !displaySrc) {
    return (
      <div
        className={`relative pointer-events-none select-none ${className}`}
        style={{
          aspectRatio: `${NYX_SPRITE_WIDTH} / ${NYX_SPRITE_HEIGHT}`,
          opacity: opacityBoost * 0.35,
        }}
        aria-hidden
      >
        <div className="absolute inset-[18%] rounded-full bg-violet-500/10 blur-2xl" />
      </div>
    );
  }

  return (
    <motion.div
      className={`relative pointer-events-none select-none ${
        compact ? "h-full max-h-full w-auto" : ""
      } ${className}`}
      style={{ opacity: opacityBoost }}
      animate={animate}
      transition={transition}
    >
      <motion.div
        key={pumpKey}
        className={`relative ${compact ? "h-full w-auto" : "w-full"}`}
        style={{
          aspectRatio: `${NYX_SPRITE_WIDTH} / ${NYX_SPRITE_HEIGHT}`,
          transformOrigin: "50% 100%",
          ...(compact ? { maxHeight: "100%", width: "auto", height: "100%" } : null),
        }}
        initial={false}
        animate={
          reduced || pumpKey === 0
            ? { scale: scaleBoost }
            : { scale: [scaleBoost, scaleBoost * 1.042, scaleBoost] }
        }
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], times: [0, 0.4, 1] }}
      >
        <motion.div
          aria-hidden
          className="absolute inset-[10%] -z-10 rounded-full blur-3xl"
          animate={{
            background: `radial-gradient(circle, ${glowFor(state)} 0%, transparent 70%)`,
            opacity: state === "cigarro02" ? 0.4 : 0.85,
          }}
          transition={{ duration: 0.45 }}
        />

        {/* LEDs laterais no thinking: roxo | verde */}
        {thinking && !reduced && (
          <>
            <motion.span
              aria-hidden
              className="absolute left-[6%] top-[42%] h-10 w-10 -translate-y-1/2 rounded-full bg-violet-500/55 blur-xl"
              animate={{ opacity: [0.35, 0.85, 0.35], scale: [0.85, 1.15, 0.85] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.span
              aria-hidden
              className="absolute left-[8%] top-[42%] h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-violet-300 shadow-[0_0_12px_rgba(167,139,250,0.9)]"
              animate={{ opacity: [0.45, 1, 0.45], scale: [0.9, 1.2, 0.9] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.span
              aria-hidden
              className="absolute right-[6%] top-[42%] h-10 w-10 -translate-y-1/2 rounded-full bg-emerald-400/50 blur-xl"
              animate={{ opacity: [0.85, 0.35, 0.85], scale: [1.15, 0.85, 1.15] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.span
              aria-hidden
              className="absolute right-[8%] top-[42%] h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.9)]"
              animate={{ opacity: [1, 0.45, 1], scale: [1.2, 0.9, 1.2] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        )}

        {/* Fumaça sutil no cigarro02 */}
        {state === "cigarro02" && !reduced && (
          <motion.span
            aria-hidden
            className="absolute left-[42%] top-[28%] h-8 w-8 rounded-full bg-white/10 blur-xl"
            animate={{ opacity: [0.05, 0.22, 0.05], y: [0, -14, -22], scale: [0.7, 1.1, 1.3] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeOut" }}
          />
        )}

        <AnimatePresence initial={false}>
          {prevSrc && prevSrc !== displaySrc && (
            <motion.div
              key={`prev-${prevSrc}`}
              className="absolute inset-0"
              initial={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
              animate={{ opacity: 0, filter: "blur(1px)", scale: 0.995 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              onAnimationComplete={() => setPrevSrc(null)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={prevSrc}
                alt=""
                width={NYX_SPRITE_WIDTH}
                height={NYX_SPRITE_HEIGHT}
                decoding="async"
                className="h-full w-full object-contain object-bottom object-center"
                draggable={false}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          key={displaySrc}
          className="absolute inset-0"
          initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, filter: "blur(1px)", scale: 0.985 }}
          animate={
            reduced
              ? { opacity: 1, scale: 1 }
              : { opacity: 1, filter: "blur(0px)", scale: [1.035, 1] }
          }
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="h-full w-full"
            animate={
              thinking && !reduced ? { opacity: [0.92, 1, 0.92] } : { opacity: 1 }
            }
            transition={
              thinking && !reduced
                ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.2 }
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displaySrc}
              alt=""
              width={NYX_SPRITE_WIDTH}
              height={NYX_SPRITE_HEIGHT}
              decoding="async"
              fetchPriority={state === "master" ? "high" : "auto"}
              className="h-full w-full object-contain object-bottom object-center drop-shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
              draggable={false}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
