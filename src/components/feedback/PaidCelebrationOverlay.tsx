"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x: ((i * 41) % 120) - 60,
  y: -((i * 23) % 90) - 20,
  size: 4 + (i % 3) * 2,
  delay: (i % 7) * 0.03,
  color: i % 3 === 0 ? "#22c55e" : i % 3 === 1 ? "#a78bfa" : "#fbbf24",
}));

interface PaidCelebrationOverlayProps {
  show: boolean;
  onDone?: () => void;
}

export function PaidCelebrationOverlay({ show, onDone }: PaidCelebrationOverlayProps) {
  useEffect(() => {
    if (!show) return;
    const id = window.setTimeout(() => onDone?.(), 1200);
    return () => window.clearTimeout(id);
  }, [show, onDone]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-hidden
        >
          <motion.div
            className="absolute inset-0 bg-emerald-500/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 0.8 }}
          />
          <motion.div
            className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/20 blur-3xl"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 2.2, 2.5], opacity: [0, 0.7, 0] }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />

          {PARTICLES.map((p) => (
            <motion.span
              key={p.id}
              className="absolute left-1/2 top-1/2 rounded-full"
              style={{
                width: p.size,
                height: p.size,
                background: p.color,
                boxShadow: `0 0 12px ${p.color}88`,
              }}
              initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                x: p.x * 2.5,
                y: p.y * 2.2,
                scale: [0, 1.3, 0.3],
              }}
              transition={{ duration: 1, delay: p.delay, ease: "easeOut" }}
            />
          ))}

          <motion.div
            className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_40px_rgba(34,197,94,0.55)]"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: [0, 1.15, 1], rotate: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 14 }}
          >
            <Check className="h-10 w-10 text-white" strokeWidth={3} />
          </motion.div>

          <motion.p
            className="absolute top-[calc(50%+4.5rem)] text-sm font-semibold tracking-wide text-emerald-300"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, -4] }}
            transition={{ duration: 1.1, times: [0, 0.2, 0.75, 1] }}
          >
            Pago!
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
