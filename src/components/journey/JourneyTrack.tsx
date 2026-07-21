"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Lock, Gift, Heart, Flag } from "lucide-react";
import { useReducedMotion, motion } from "framer-motion";
import type { JourneyTrackNode } from "@/lib/journey/types";
import { JOURNEY_MISSION_ICONS } from "./journeyMissionIcons";

const CHAPTER_NUMBER: Record<string, string> = {
  ch_1: "Capítulo 1",
  ch_2: "Capítulo 2",
  ch_3: "Capítulo 3",
};

export function nodeDomId(id: string) {
  return `journey-node-${id}`;
}

/**
 * Caminho ondulado em S ligando os nós na ordem da trilha.
 * Mede a posição real de cada nó e desenha curvas de bezier entre eles.
 */
function useSnakePath(
  containerRef: React.RefObject<HTMLDivElement | null>,
  interactiveIds: string[]
) {
  const [path, setPath] = useState<string>("");
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const idsKey = interactiveIds.join("|");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const compute = () => {
      const rect = container.getBoundingClientRect();
      const points: Array<{ x: number; y: number }> = [];
      for (const id of idsKey.split("|")) {
        if (!id) continue;
        const el = document.getElementById(nodeDomId(id));
        if (!el) continue;
        const circle = el.querySelector("[data-node-circle]") ?? el;
        const r = circle.getBoundingClientRect();
        points.push({
          x: r.left + r.width / 2 - rect.left,
          y: r.top + r.height / 2 - rect.top,
        });
      }
      if (points.length < 2) {
        setPath("");
        return;
      }
      let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        const dy = b.y - a.y;
        // Controles verticais criam a onda em S entre os lados
        d += ` C ${a.x.toFixed(1)} ${(a.y + dy * 0.55).toFixed(1)}, ${b.x.toFixed(1)} ${(b.y - dy * 0.55).toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
      }
      setPath(d);
      setSize({ w: rect.width, h: rect.height });
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(container);
    // Recalcula depois que fontes/imagens assentam
    const t = setTimeout(compute, 300);
    return () => {
      ro.disconnect();
      clearTimeout(t);
    };
  }, [containerRef, idsKey]);

  return { path, size };
}

export function JourneyTrack({
  nodes,
  onNodeClick,
}: {
  nodes: JourneyTrackNode[];
  onNodeClick: (node: JourneyTrackNode) => void;
}) {
  const reduced = useReducedMotion() ?? false;
  const interactive = nodes.filter((n) => n.kind !== "chapter");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { path, size } = useSnakePath(
    containerRef,
    interactive.map((n) => n.id)
  );

  return (
    <div ref={containerRef} className="relative mx-auto mt-6 w-full max-w-2xl px-2 pb-20">
      {/* Caminho ondulado em S ligando os nós */}
      {path && size.h > 0 ? (
        <svg
          className="pointer-events-none absolute inset-0"
          width={size.w}
          height={size.h}
          viewBox={`0 0 ${size.w} ${size.h}`}
          aria-hidden
        >
          <defs>
            <linearGradient id="journey-path-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.75" />
              <stop offset="50%" stopColor="#e879f9" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.45" />
            </linearGradient>
          </defs>
          {/* glow */}
          <path
            d={path}
            fill="none"
            stroke="rgba(167,139,250,0.18)"
            strokeWidth={14}
            strokeLinecap="round"
          />
          {/* trilho principal */}
          <path
            d={path}
            fill="none"
            stroke="url(#journey-path-grad)"
            strokeWidth={6}
            strokeLinecap="round"
          />
          {/* pontilhado central estilo caminho de jogo */}
          <path
            d={path}
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="1 14"
          />
        </svg>
      ) : null}

      <ol className="relative space-y-10">
        {nodes.map((node) => {
          if (node.kind === "chapter") {
            return (
              <li key={node.id} className="relative z-10 px-1">
                <div className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-r from-[#221240]/95 via-[#1a0f33]/95 to-[#150d26]/95 px-5 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                  <span
                    className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-violet-400 to-fuchsia-500"
                    aria-hidden
                  />
                  <div className="flex items-center gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-300">
                      <Flag className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-300/80">
                        {CHAPTER_NUMBER[node.id] ?? "Capítulo"}
                      </p>
                      <h2 className="text-lg font-extrabold leading-tight text-white">
                        {node.name}
                      </h2>
                      <p className="mt-0.5 truncate text-xs text-violet-100/60">
                        {node.description}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            );
          }

          const idx = interactive.indexOf(node);
          const side = idx % 2 === 0 ? "left" : "right";
          const align =
            side === "left"
              ? "justify-start pl-[6%] sm:pl-[12%]"
              : "justify-end pr-[6%] sm:pr-[12%]";

          if (node.kind === "reward") {
            const locked = node.status === "locked";
            const ready = node.status === "ready";
            return (
              <li
                key={node.id}
                id={nodeDomId(node.id)}
                className={`relative z-10 flex ${align}`}
              >
                <button
                  type="button"
                  onClick={() => onNodeClick(node)}
                  aria-label={`Recompensa ${node.title}, ${
                    locked ? "bloqueada" : ready ? "liberada" : "resgatada"
                  }`}
                  className={`group flex flex-col items-center gap-2 focus-visible:outline-none ${
                    locked ? "opacity-60" : ""
                  }`}
                >
                  <span className="relative">
                    {!locked && !reduced ? (
                      <span
                        className="absolute -inset-2 rounded-full bg-amber-400/25 blur-lg"
                        aria-hidden
                      />
                    ) : null}
                    <motion.span
                      data-node-circle
                      className={`relative flex h-[92px] w-[92px] items-center justify-center overflow-hidden rounded-full border-4 shadow-xl transition group-focus-visible:ring-4 group-focus-visible:ring-amber-300/60 ${
                        locked
                          ? "border-slate-500/50 bg-slate-700/80 text-slate-400"
                          : "border-amber-300 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 text-amber-950"
                      }`}
                      whileTap={reduced ? undefined : { scale: 0.93 }}
                      whileHover={reduced ? undefined : { scale: 1.06, rotate: -2 }}
                    >
                      {locked ? (
                        <Lock className="h-8 w-8" aria-hidden />
                      ) : node.preview &&
                        !node.preview.includes("placeholder") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={node.preview}
                          alt=""
                          className="h-full w-full object-cover object-top"
                        />
                      ) : (
                        <Gift className="h-9 w-9" aria-hidden />
                      )}
                    </motion.span>
                    {ready ? (
                      <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-950 shadow">
                        Abrir
                      </span>
                    ) : null}
                  </span>
                  <span className="max-w-[8.5rem] text-center">
                    <span
                      className={`block text-sm font-bold ${
                        locked ? "text-slate-300/80" : "text-amber-200"
                      }`}
                    >
                      {node.title}
                    </span>
                    <span className="block text-[10px] font-semibold uppercase tracking-widest text-amber-300/60">
                      {locked ? "Desbloqueia" : ready ? "Liberada!" : "Sua"}
                    </span>
                  </span>
                </button>
              </li>
            );
          }

          // mission
          const Icon = JOURNEY_MISSION_ICONS[node.icon];
          const isCurrent = node.status === "current";
          const isDone = node.status === "completed";
          const isLocked = node.status === "locked";

          const circle = isDone
            ? "border-emerald-300 bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-[0_6px_24px_rgba(16,185,129,0.35)]"
            : isCurrent
              ? "border-violet-300 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-violet-600 text-white shadow-[0_0_36px_rgba(167,139,250,0.55)]"
              : isLocked
                ? "border-slate-500/50 bg-slate-700/80 text-slate-400"
                : "border-cyan-300 bg-gradient-to-br from-sky-400 to-cyan-500 text-white shadow-[0_6px_24px_rgba(34,211,238,0.3)]";

          const size = isCurrent ? "h-[108px] w-[108px]" : "h-[88px] w-[88px]";

          return (
            <li
              key={node.id}
              id={nodeDomId(node.id)}
              className={`relative z-10 flex ${align}`}
            >
              <button
                type="button"
                onClick={() => onNodeClick(node)}
                aria-label={`Missão ${node.title}, ${node.status}`}
                aria-disabled={isLocked}
                className={`group flex flex-col items-center gap-2 focus-visible:outline-none ${
                  isLocked ? "opacity-70" : ""
                }`}
              >
                <span className="relative">
                  {isCurrent && !reduced ? (
                    <motion.span
                      className="absolute -inset-3 rounded-full bg-violet-500/25 blur-xl"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2.4, repeat: Infinity }}
                      aria-hidden
                    />
                  ) : null}
                  <motion.span
                    data-node-circle
                    className={`relative flex items-center justify-center rounded-full border-4 transition group-focus-visible:ring-4 group-focus-visible:ring-violet-300/60 ${circle} ${size}`}
                    animate={
                      isCurrent && !reduced ? { scale: [1, 1.045, 1] } : undefined
                    }
                    transition={
                      isCurrent
                        ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
                        : undefined
                    }
                    whileTap={reduced ? undefined : { scale: 0.93 }}
                    whileHover={
                      reduced || isLocked ? undefined : { scale: 1.06 }
                    }
                  >
                    {isDone ? (
                      <Check className="h-10 w-10" strokeWidth={3.2} aria-hidden />
                    ) : isLocked ? (
                      <Lock className="h-8 w-8" aria-hidden />
                    ) : (
                      <Icon className={isCurrent ? "h-11 w-11" : "h-9 w-9"} aria-hidden />
                    )}
                    {/* brilho superior */}
                    <span
                      className="pointer-events-none absolute inset-x-3 top-1.5 h-1/3 rounded-full bg-white/25 blur-[2px]"
                      aria-hidden
                    />
                  </motion.span>
                  {isCurrent ? (
                    <motion.span
                      className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-lg"
                      animate={reduced ? undefined : { y: [0, -2, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                    >
                      Continuar
                    </motion.span>
                  ) : null}
                </span>
                <span className="mt-1 max-w-[9rem] text-center text-[13px] font-bold leading-tight text-white/90">
                  {node.title}
                </span>
                {!isDone && node.progressTarget > 1 ? (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-violet-100/80">
                    {node.progressCurrent} de {node.progressTarget}
                  </span>
                ) : null}
                {isDone ? (
                  <span
                    className="-mt-1 flex gap-0.5 text-sm text-amber-300 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]"
                    aria-hidden
                  >
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>

      {/* Fim da trilha */}
      <div className="relative z-10 mt-10 flex justify-center">
        <div className="rounded-full border border-violet-400/20 bg-[#150d26]/80 px-4 py-1.5 text-xs font-semibold text-violet-200/70">
          Mais missões em breve ✨
        </div>
      </div>
    </div>
  );
}
