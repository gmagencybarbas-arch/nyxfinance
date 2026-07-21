import { describe, expect, it } from "vitest";
import {
  evaluateMissionCompletions,
  isChapter2Complete,
  toJourneyProgressSnapshot,
  type RawJourneyFacts,
} from "../progress";
import { MISSION_IDS, JOURNEY_COLLECTION_ID, LEGACY_INACTIVE_MISSION_IDS } from "../ids";
import { getMissionAction, missionHref } from "../missionActionMap";
import {
  JOURNEY_MISSIONS,
  JOURNEY_TRACK_ORDER,
  JOURNEY_REWARDS,
  JOURNEY_COLLECTION_NAME,
} from "../catalog";

const emptyFacts: RawJourneyFacts = {
  profileComplete: false,
  hasAvatar: false,
  hasMonthlyIncome: false,
  expenseCount: 0,
  hasRecurring: false,
  hasIncomeTx: false,
  hasInstallment: false,
  assistantInteractionCount: 0,
  planningViewed: false,
  evaUnlocked: false,
};

describe("journey MVP catalog", () => {
  it("tem exatamente 10 missões ativas na coleção", () => {
    expect(JOURNEY_MISSIONS).toHaveLength(10);
    expect(JOURNEY_MISSIONS.every((m) => m.countsForCollection)).toBe(true);
    expect(JOURNEY_COLLECTION_ID).toBe("journey_collection_01");
    expect(JOURNEY_COLLECTION_NAME).toBe("Colocando a vida em ordem");
  });

  it("ordem visual: Eva após 4 missões, Boa noite após cap.2, Nyx Praia no fim", () => {
    const kinds = JOURNEY_TRACK_ORDER.filter((s) => s.type !== "chapter").map(
      (s) => ("missionId" in s ? s.missionId : s.rewardId)
    );
    expect(kinds).toEqual([
      MISSION_IDS.completeProfile,
      MISSION_IDS.uploadProfilePicture,
      MISSION_IDS.setMonthlyIncome,
      MISSION_IDS.createFirstExpense,
      "r_eva",
      MISSION_IDS.createFirstRecurringBill,
      MISSION_IDS.createThreeExpenses,
      MISSION_IDS.createFirstIncome,
      MISSION_IDS.createFirstInstallment,
      "r_eva_goodnight",
      MISSION_IDS.completeFiveAssistantInteractions,
      MISSION_IDS.viewPlanning,
      "r_nyx_beach",
    ]);
  });

  it("missões legadas ficam fora da trilha ativa", () => {
    const active = new Set(JOURNEY_MISSIONS.map((m) => m.id));
    for (const id of LEGACY_INACTIVE_MISSION_IDS) {
      expect(active.has(id as never)).toBe(false);
    }
  });
});

describe("journey progress MVP", () => {
  it("não marca missão sem fato real", () => {
    const c = evaluateMissionCompletions(emptyFacts);
    expect(Object.values(c).every((v) => !v.done)).toBe(true);
    const snap = toJourneyProgressSnapshot(c);
    expect(snap.completedMissionCount).toBe(0);
    expect(snap.completedCollection1).toBe(false);
  });

  it("Eva libera após quaisquer 3 missões", () => {
    const c = evaluateMissionCompletions({
      ...emptyFacts,
      profileComplete: true,
      hasAvatar: true,
      hasMonthlyIncome: true,
    });
    const snap = toJourneyProgressSnapshot(c);
    expect(snap.completedMissionCount).toBe(3);
    expect(
      JOURNEY_REWARDS.find((r) => r.id === "r_eva")!.unlockAfterMissionCount
    ).toBe(3);
  });

  it("três gastos mostra progresso X de 3", () => {
    const c = evaluateMissionCompletions({
      ...emptyFacts,
      expenseCount: 2,
    });
    expect(c[MISSION_IDS.createThreeExpenses]).toEqual({
      done: false,
      current: 2,
      target: 3,
    });
    expect(c[MISSION_IDS.createFirstExpense].done).toBe(true);
  });

  it("capítulo 2 completo exige as 4 missões", () => {
    const partial = evaluateMissionCompletions({
      ...emptyFacts,
      hasRecurring: true,
      expenseCount: 3,
      hasIncomeTx: true,
    });
    expect(isChapter2Complete(partial)).toBe(false);

    const full = evaluateMissionCompletions({
      ...emptyFacts,
      hasRecurring: true,
      expenseCount: 3,
      hasIncomeTx: true,
      hasInstallment: true,
    });
    expect(isChapter2Complete(full)).toBe(true);
  });

  it("coleção completa só com as 10", () => {
    const c = evaluateMissionCompletions({
      profileComplete: true,
      hasAvatar: true,
      hasMonthlyIncome: true,
      expenseCount: 3,
      hasRecurring: true,
      hasIncomeTx: true,
      hasInstallment: true,
      assistantInteractionCount: 5,
      planningViewed: true,
      evaUnlocked: true,
    });
    expect(toJourneyProgressSnapshot(c).completedCollection1).toBe(true);
    expect(toJourneyProgressSnapshot(c).completedMissionCount).toBe(10);
  });
});

describe("missionActionMap MVP", () => {
  it("mapeia CTA e rota para cada missão", () => {
    for (const m of JOURNEY_MISSIONS) {
      const action = getMissionAction(m.id);
      expect(action).not.toBeNull();
      expect(action!.ctaLabel.length).toBeGreaterThan(0);
      expect(missionHref(m.id)).toMatch(/^\//);
    }
  });

  it("primeiro gasto vai para o chat", () => {
    expect(missionHref(MISSION_IDS.createFirstExpense)).toBe("/nyx");
  });
});
