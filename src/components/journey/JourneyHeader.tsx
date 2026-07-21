"use client";

import type { JourneyStateDto } from "@/lib/journey/types";

export function JourneyHeader({
  state,
}: {
  state: JourneyStateDto | null;
  loading?: boolean;
}) {
  const pct =
    state && state.totalMissionCount > 0
      ? Math.round(
          (state.completedMissionCount / state.totalMissionCount) * 100
        )
      : 0;

  return (
    <header className="mx-auto w-full max-w-[1050px] px-1">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
            Jornada
          </h1>
          <p className="mt-0.5 text-sm text-violet-100/60">
            Cumprindo missões e destravando novidades.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-extrabold text-emerald-300">{pct}%</p>
          <p className="text-[11px] text-violet-100/50">concluído</p>
        </div>
      </div>

      {/* Barra de progresso principal */}
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/[0.08] shadow-inner">
        <div
          className="relative h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-emerald-300 transition-all duration-700"
          style={{ width: `${Math.max(pct, 2)}%` }}
        >
          <span className="absolute inset-0 rounded-full bg-white/20 [mask-image:linear-gradient(180deg,white,transparent)]" />
        </div>
      </div>

    </header>
  );
}
