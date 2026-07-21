"use client";

import { Gift, Sparkles } from "lucide-react";
import { useAssistantOptional } from "@/contexts/AssistantContext";
import { getPersonalityConfig } from "@/lib/assistant/personalityConfig";
import type { PersonalityKey } from "@/lib/assistant/ids";
import type { JourneyStateDto } from "@/lib/journey/types";

const CHARACTER_TIPS: Record<PersonalityKey, string> = {
  nyx: "Termina logo essa missão. Eu tô olhando.",
  eva: "Um passinho de cada vez — você tá indo bem!",
};

export function JourneySidebar({
  state,
}: {
  state: JourneyStateDto | null;
}) {
  const assistant = useAssistantOptional();
  const personalityKey = (assistant?.activePersonalityKey ??
    "nyx") as PersonalityKey;
  const personality = getPersonalityConfig(personalityKey);

  const pct =
    state && state.totalMissionCount > 0
      ? Math.round(
          (state.completedMissionCount / state.totalMissionCount) * 100
        )
      : 0;

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-20 space-y-4 rounded-3xl border border-violet-400/15 bg-[#150d26]/80 p-5 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-md">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-300/70">
            Coleção atual
          </p>
          <h2 className="mt-1 text-lg font-bold leading-snug text-white">
            {state?.collectionName ?? "Carregando…"}
          </h2>
          <p className="mt-1 text-sm text-violet-100/60">
            {state?.collectionDescription ??
              "Pequenos passos pra sua vida financeira parar de parecer um acidente."}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-violet-100/70">
              {state
                ? `${state.completedMissionCount} de ${state.totalMissionCount} missões`
                : "—"}
            </span>
            <span className="text-lg font-bold text-emerald-300">{pct}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-emerald-300 shadow-[0_0_12px_rgba(167,139,250,0.5)] transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {state?.nextRewardTitle ? (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-300/20 bg-gradient-to-r from-amber-400/10 to-yellow-500/5 p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-yellow-500 text-amber-950 shadow-[0_0_16px_rgba(251,191,36,0.35)]">
              <Gift className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-200/80">
                Próxima recompensa
              </p>
              <p className="truncate text-sm font-semibold text-amber-100">
                {state.nextRewardTitle}
              </p>
            </div>
          </div>
        ) : state?.collectionComplete ? (
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
            Coleção concluída.
          </div>
        ) : null}

        <div className="flex items-start gap-2 rounded-2xl bg-white/[0.04] p-3">
          <Sparkles
            className="mt-0.5 h-4 w-4 shrink-0 text-violet-300"
            aria-hidden
          />
          <p className="text-xs leading-relaxed text-violet-100/70">
            <span className="font-semibold text-violet-200">
              {personality.displayName}:
            </span>{" "}
            {CHARACTER_TIPS[personalityKey]}
          </p>
        </div>
      </div>
    </aside>
  );
}
