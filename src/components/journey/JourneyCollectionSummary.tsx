"use client";

import type { JourneyStateDto } from "@/lib/journey/types";

/** Resumo leve da coleção entre hero e trilha. */
export function JourneyCollectionSummary({
  state,
  loading,
}: {
  state: JourneyStateDto | null;
  loading: boolean;
}) {
  const pct =
    state && state.totalMissionCount > 0
      ? Math.round(
          (state.completedMissionCount / state.totalMissionCount) * 100
        )
      : 0;

  if (loading && !state) {
    return (
      <div className="mx-auto mt-4 h-14 w-full max-w-[1050px] animate-pulse rounded-2xl bg-white/[0.04]" />
    );
  }

  if (!state) return null;

  return (
    <div className="mx-auto mt-4 w-full max-w-[1050px] rounded-2xl border border-violet-400/10 bg-[#150d26]/50 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-widest text-violet-300/60">
            {state.collectionName}
          </p>
          <p className="text-sm text-violet-100/70">
            {state.completedMissionCount} de {state.totalMissionCount} missões
          </p>
        </div>
        <p className="shrink-0 text-lg font-bold text-emerald-300/90">{pct}%</p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500/80 to-emerald-400/80 transition-all duration-700"
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
    </div>
  );
}
