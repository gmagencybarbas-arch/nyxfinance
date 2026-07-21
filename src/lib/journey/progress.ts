import { prisma } from "@/lib/prisma";
import { CHARACTER_IDS } from "@/lib/assistant/ids";
import type { JourneyProgressSnapshot } from "@/lib/assistant/unlockRules";
import {
  CHAPTER_2_MISSION_IDS,
  JOURNEY_EVENT_KEYS,
  MISSION_IDS,
  type MissionId,
} from "./ids";
import { JOURNEY_MISSIONS } from "./catalog";

export type MissionProgress = {
  done: boolean;
  current: number;
  target: number;
};

export type MissionCompletionMap = Record<MissionId, MissionProgress>;

export type RawJourneyFacts = {
  profileComplete: boolean;
  hasAvatar: boolean;
  hasMonthlyIncome: boolean;
  expenseCount: number;
  hasRecurring: boolean;
  hasIncomeTx: boolean;
  hasInstallment: boolean;
  assistantInteractionCount: number;
  planningViewed: boolean;
  evaUnlocked: boolean;
};

function isNonEmpty(value: string | null | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

export async function loadJourneyFacts(userId: string): Promise<RawJourneyFacts> {
  const [
    expenseCount,
    incomeCount,
    profile,
    recurringCount,
    installmentCount,
    events,
    evaUnlock,
  ] = await Promise.all([
    prisma.transaction.count({
      where: {
        userId,
        type: "EXPENSE",
        status: { not: "CANCELED" },
      },
    }),
    prisma.transaction.count({
      where: {
        userId,
        type: "INCOME",
        status: { not: "CANCELED" },
      },
    }),
    prisma.profile.findUnique({
      where: { id: userId },
      select: {
        displayName: true,
        avatarUrl: true,
        salaryRange: true,
        payday: true,
        financialGoal: true,
      },
    }),
    prisma.recurringBill.count({ where: { userId } }),
    prisma.installmentPlan.count({ where: { userId } }),
    prisma.userJourneyEvent.findMany({
      where: { userId },
      select: { eventKey: true, metadata: true },
    }),
    prisma.userCharacterUnlock.findUnique({
      where: {
        userId_characterId: { userId, characterId: CHARACTER_IDS.eva },
      },
      select: { id: true },
    }),
  ]);

  const eventByKey = new Map(events.map((e) => [e.eventKey, e]));
  const interactionMeta = eventByKey.get(JOURNEY_EVENT_KEYS.assistantInteractions)
    ?.metadata as { count?: number } | null | undefined;
  const assistantInteractionCount = Math.max(
    0,
    Number(interactionMeta?.count ?? 0) || 0
  );

  // Campos obrigatórios reais do onboarding/perfil
  const profileComplete = Boolean(
    profile &&
      isNonEmpty(profile.displayName) &&
      isNonEmpty(profile.salaryRange) &&
      profile.payday != null &&
      profile.payday >= 1 &&
      profile.payday <= 31 &&
      isNonEmpty(profile.financialGoal)
  );

  return {
    profileComplete,
    hasAvatar: isNonEmpty(profile?.avatarUrl),
    hasMonthlyIncome: isNonEmpty(profile?.salaryRange),
    expenseCount,
    hasRecurring: recurringCount > 0,
    hasIncomeTx: incomeCount > 0,
    hasInstallment: installmentCount > 0,
    assistantInteractionCount,
    planningViewed:
      eventByKey.has(JOURNEY_EVENT_KEYS.planningViewed) ||
      // compat com evento antigo
      eventByKey.has("open_planning"),
    evaUnlocked: Boolean(evaUnlock),
  };
}

function progress(current: number, target: number): MissionProgress {
  const capped = Math.min(current, target);
  return { done: capped >= target, current: capped, target };
}

export function evaluateMissionCompletions(
  facts: RawJourneyFacts
): MissionCompletionMap {
  return {
    [MISSION_IDS.completeProfile]: progress(facts.profileComplete ? 1 : 0, 1),
    [MISSION_IDS.uploadProfilePicture]: progress(facts.hasAvatar ? 1 : 0, 1),
    [MISSION_IDS.setMonthlyIncome]: progress(facts.hasMonthlyIncome ? 1 : 0, 1),
    [MISSION_IDS.createFirstExpense]: progress(facts.expenseCount > 0 ? 1 : 0, 1),
    [MISSION_IDS.createFirstRecurringBill]: progress(
      facts.hasRecurring ? 1 : 0,
      1
    ),
    [MISSION_IDS.createThreeExpenses]: progress(facts.expenseCount, 3),
    [MISSION_IDS.createFirstIncome]: progress(facts.hasIncomeTx ? 1 : 0, 1),
    [MISSION_IDS.createFirstInstallment]: progress(
      facts.hasInstallment ? 1 : 0,
      1
    ),
    [MISSION_IDS.completeFiveAssistantInteractions]: progress(
      facts.assistantInteractionCount,
      5
    ),
    [MISSION_IDS.viewPlanning]: progress(facts.planningViewed ? 1 : 0, 1),
  };
}

export function isChapter2Complete(completions: MissionCompletionMap): boolean {
  return CHAPTER_2_MISSION_IDS.every((id) => completions[id].done);
}

export function toJourneyProgressSnapshot(
  completions: MissionCompletionMap
): JourneyProgressSnapshot {
  const required = JOURNEY_MISSIONS.filter((m) => m.countsForCollection);
  const summaries = required.map((m) => ({
    id: m.id,
    title: m.title,
    done: completions[m.id].done,
  }));
  const completedMissionCount = summaries.filter((s) => s.done).length;
  const completedCollection1 = summaries.every((s) => s.done);
  const chapter2Complete = isChapter2Complete(completions);

  return {
    completedMissionCount,
    completedCollection1,
    chapter2Complete,
    missionSummaries: summaries,
  };
}

export async function loadJourneyProgressSnapshot(
  userId: string
): Promise<JourneyProgressSnapshot> {
  const facts = await loadJourneyFacts(userId);
  return toJourneyProgressSnapshot(evaluateMissionCompletions(facts));
}
