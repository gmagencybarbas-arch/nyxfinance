import type { UnlockRequirement } from "./types";
import { CHAPTER_2_MISSION_IDS } from "@/lib/journey/ids";

export type JourneyProgressSnapshot = {
  completedMissionCount: number;
  completedCollection1: boolean;
  /** Capítulo 2 completo (4 missões) — Boa noite Eva. */
  chapter2Complete?: boolean;
  missionSummaries: Array<{ id: string; title: string; done: boolean }>;
};

/**
 * @deprecated Prefer `loadJourneyProgressSnapshot` (async, dados reais).
 * Mantido só para callers síncronos no client — retorna vazio (nunca inventa).
 */
export function getJourneyProgressSnapshot(
  _userId: string
): JourneyProgressSnapshot {
  return {
    completedMissionCount: 0,
    completedCollection1: false,
    chapter2Complete: false,
    missionSummaries: [],
  };
}

type RuleResolver = (
  progress: JourneyProgressSnapshot
) => Omit<UnlockRequirement, "ruleKey">;

const RULES: Record<string, RuleResolver> = {
  journey_missions_3: (p) => {
    const target = 3;
    const current = Math.min(p.completedMissionCount, target);
    const lines =
      p.missionSummaries.length > 0
        ? p.missionSummaries.slice(0, 3).map((m) =>
            m.done ? `✓ ${m.title}` : m.title
          )
        : [
            "Complete o perfil",
            "Adicione uma foto",
            "Informe a renda",
          ];
    return {
      title: "Conheça a Eva",
      description: "Complete três missões da Jornada para desbloquear.",
      current,
      target,
      summaryLines: lines,
      available: current >= target,
    };
  },
  journey_collection_1_complete: (p) => ({
    title: "Complete a primeira Jornada",
    description:
      "Conclua as 10 missões de “Colocando a vida em ordem”.",
    current: p.completedCollection1 ? 1 : 0,
    target: 1,
    summaryLines: p.completedCollection1
      ? ["Coleção concluída"]
      : p.missionSummaries.map((m) => (m.done ? `✓ ${m.title}` : m.title)),
    available: p.completedCollection1,
  }),
  journey_eva_fitness_pending: (p) => {
    const chapterDone =
      p.chapter2Complete ??
      CHAPTER_2_MISSION_IDS.every((id) =>
        p.missionSummaries.some((m) => m.id === id && m.done)
      );
    const lines = CHAPTER_2_MISSION_IDS.map((id) => {
      const m = p.missionSummaries.find((s) => s.id === id);
      if (!m) return id;
      return m.done ? `✓ ${m.title}` : m.title;
    });
    return {
      title: "Organizando a bagunça",
      description:
        "Conclua as 4 missões do Capítulo 2 (e tenha a Eva liberada).",
      current: chapterDone ? 1 : 0,
      target: 1,
      summaryLines: chapterDone
        ? ["Capítulo 2 concluído"]
        : lines,
      available: chapterDone,
    };
  },
};

export function resolveUnlockRequirement(
  ruleKey: string | null | undefined,
  progress: JourneyProgressSnapshot
): UnlockRequirement | undefined {
  if (!ruleKey) return undefined;
  const resolver = RULES[ruleKey];
  if (!resolver) {
    return {
      ruleKey,
      title: "Desbloqueio especial",
      description: "Este visual será liberado por uma missão futura.",
      current: 0,
      target: 1,
      summaryLines: ["Regra ainda não conectada à Jornada"],
      available: false,
    };
  }
  return { ruleKey, ...resolver(progress) };
}

export function isUnlockRuleSatisfied(
  ruleKey: string | null | undefined,
  progress: JourneyProgressSnapshot
): boolean {
  if (!ruleKey) return true;
  return Boolean(resolveUnlockRequirement(ruleKey, progress)?.available);
}
