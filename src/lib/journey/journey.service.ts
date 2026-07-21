import {
  grantCharacterUnlock,
  grantSkinUnlock,
} from "@/lib/assistant/assistant.service";
import { CHARACTER_IDS, SKIN_IDS } from "@/lib/assistant/ids";
import { prisma } from "@/lib/prisma";
import {
  JOURNEY_CHAPTERS,
  JOURNEY_COLLECTION_DESCRIPTION,
  JOURNEY_COLLECTION_ID,
  JOURNEY_COLLECTION_NAME,
  JOURNEY_MISSIONS,
  JOURNEY_REWARDS,
  JOURNEY_TRACK_ORDER,
  rewardPreview,
} from "./catalog";
import {
  JOURNEY_EVENT_KEYS,
  MISSION_IDS,
  type JourneyEventKey,
  type MissionId,
} from "./ids";
import {
  evaluateMissionCompletions,
  isChapter2Complete,
  loadJourneyFacts,
  toJourneyProgressSnapshot,
  type MissionCompletionMap,
} from "./progress";
import type {
  JourneyStateDto,
  JourneyTrackNode,
  MissionStatus,
  RewardNodeStatus,
} from "./types";

function missionStatus(input: {
  id: MissionId;
  done: boolean;
  locked: boolean;
  currentId: MissionId | null;
}): MissionStatus {
  if (input.done) return "completed";
  if (input.locked) return "locked";
  if (input.currentId === input.id) return "current";
  return "available";
}

function pickCurrentMission(
  completions: MissionCompletionMap,
  evaUnlocked: boolean
): MissionId | null {
  for (const m of JOURNEY_MISSIONS) {
    if (completions[m.id].done) continue;
    if (m.requiresEva && !evaUnlocked) continue;
    return m.id;
  }
  return null;
}

function rewardEligible(input: {
  reward: (typeof JOURNEY_REWARDS)[number];
  progress: ReturnType<typeof toJourneyProgressSnapshot>;
  completions: MissionCompletionMap;
  evaUnlocked: boolean;
}): boolean {
  const { reward, progress, completions, evaUnlocked } = input;

  if (
    reward.unlockAfterMissionCount != null &&
    progress.completedMissionCount >= reward.unlockAfterMissionCount
  ) {
    return true;
  }

  if (reward.requiresCollectionComplete) {
    if (
      reward.collectionId &&
      reward.collectionId !== JOURNEY_COLLECTION_ID
    ) {
      return false;
    }
    return progress.completedCollection1;
  }

  if (reward.requiresChapterId === "ch_2") {
    const chapterOk = isChapter2Complete(completions);
    if (!chapterOk) return false;
    if (reward.requiresEva && !evaUnlocked) return false;
    return true;
  }

  if (reward.requiresMissionId && completions[reward.requiresMissionId]?.done) {
    if (reward.requiresEva && !evaUnlocked) return false;
    return true;
  }

  return false;
}

async function syncJourneyRewards(
  userId: string,
  completions: MissionCompletionMap,
  progress: ReturnType<typeof toJourneyProgressSnapshot>,
  evaUnlocked: boolean
): Promise<string[]> {
  const newly: string[] = [];
  const [charUnlocks, skinUnlocks] = await Promise.all([
    prisma.userCharacterUnlock.findMany({
      where: { userId },
      select: { characterId: true },
    }),
    prisma.userSkinUnlock.findMany({
      where: { userId },
      select: { skinId: true },
    }),
  ]);
  const chars = new Set(charUnlocks.map((u) => u.characterId));
  const skins = new Set(skinUnlocks.map((u) => u.skinId));
  let evaNow = evaUnlocked || chars.has(CHARACTER_IDS.eva);

  for (const reward of JOURNEY_REWARDS) {
    if (
      !rewardEligible({
        reward,
        progress,
        completions,
        evaUnlocked: evaNow,
      })
    ) {
      continue;
    }

    if (reward.kind === "character" && reward.characterId) {
      if (!chars.has(reward.characterId)) {
        await grantCharacterUnlock(userId, reward.characterId, "journey", {
          rewardId: reward.id,
          collectionId: JOURNEY_COLLECTION_ID,
        });
        newly.push(reward.id);
        chars.add(reward.characterId);
        if (reward.characterId === CHARACTER_IDS.eva) evaNow = true;
        if (reward.skinId) skins.add(reward.skinId);
      }
      continue;
    }

    if (reward.kind === "skin" && reward.skinId) {
      if (skins.has(reward.skinId)) continue;
      if (
        reward.skinId !== SKIN_IDS.nyxBeach &&
        reward.skinId !== SKIN_IDS.evaFitness
      ) {
        continue;
      }
      // Boa noite Eva: se Eva acabou de liberar neste sync, reavalia
      if (reward.requiresEva && !evaNow) continue;

      await grantSkinUnlock(userId, reward.skinId, "journey", {
        rewardId: reward.id,
        collectionId: JOURNEY_COLLECTION_ID,
      });
      newly.push(reward.id);
      skins.add(reward.skinId);
    }
  }

  // Segunda passada: Boa noite Eva pode depender da Eva liberada acima
  for (const reward of JOURNEY_REWARDS) {
    if (reward.id !== "r_eva_goodnight") continue;
    if (skins.has(SKIN_IDS.evaFitness)) continue;
    if (
      !rewardEligible({
        reward,
        progress,
        completions,
        evaUnlocked: evaNow,
      })
    ) {
      continue;
    }
    await grantSkinUnlock(userId, SKIN_IDS.evaFitness, "journey", {
      rewardId: reward.id,
      collectionId: JOURNEY_COLLECTION_ID,
    });
    newly.push(reward.id);
  }

  return newly;
}

function assistantMissionTitle(activeName: string): string {
  return `Converse 5 vezes com a ${activeName}`;
}

function buildNodes(input: {
  completions: MissionCompletionMap;
  evaUnlocked: boolean;
  unlockedCharacterIds: Set<string>;
  unlockedSkinIds: Set<string>;
  assistantDisplayName: string;
}): JourneyTrackNode[] {
  const currentId = pickCurrentMission(input.completions, input.evaUnlocked);
  const chapterById = new Map(JOURNEY_CHAPTERS.map((c) => [c.id, c]));
  const missionById = new Map(JOURNEY_MISSIONS.map((m) => [m.id, m]));
  const rewardById = new Map(JOURNEY_REWARDS.map((r) => [r.id, r]));
  const progress = toJourneyProgressSnapshot(input.completions);
  const nodes: JourneyTrackNode[] = [];

  for (const step of JOURNEY_TRACK_ORDER) {
    if (step.type === "chapter") {
      const ch = chapterById.get(step.chapterId);
      if (!ch) continue;
      nodes.push({
        kind: "chapter",
        id: ch.id,
        name: ch.name,
        description: ch.description,
      });
      continue;
    }

    if (step.type === "mission") {
      const m = missionById.get(step.missionId);
      if (!m) continue;
      const prog = input.completions[m.id];
      const locked = Boolean(m.requiresEva && !input.evaUnlocked && !prog.done);
      let status = missionStatus({
        id: m.id,
        done: prog.done,
        locked,
        currentId,
      });
      if (!prog.done && !locked && m.id !== currentId) {
        status = "available";
      }
      const ch = chapterById.get(m.chapterId);
      const title =
        m.id === MISSION_IDS.completeFiveAssistantInteractions
          ? assistantMissionTitle(input.assistantDisplayName)
          : m.title;
      nodes.push({
        kind: "mission",
        id: m.id,
        title,
        description: m.description,
        icon: m.icon,
        status,
        progressCurrent: prog.current,
        progressTarget: prog.target,
        chapterId: m.chapterId,
        chapterName: ch?.name ?? "",
      });
      continue;
    }

    const reward = rewardById.get(step.rewardId);
    if (!reward) continue;

    let unlocked = false;
    if (reward.kind === "character" && reward.characterId) {
      unlocked = input.unlockedCharacterIds.has(reward.characterId);
    } else if (reward.skinId) {
      unlocked = input.unlockedSkinIds.has(reward.skinId);
    }

    const eligible = rewardEligible({
      reward,
      progress,
      completions: input.completions,
      evaUnlocked: input.evaUnlocked,
    });

    let status: RewardNodeStatus = "locked";
    if (unlocked) status = "claimed";
    else if (eligible) status = "ready";

    nodes.push({
      kind: "reward",
      id: reward.id,
      title: reward.title,
      phrase: reward.phrase,
      status,
      preview: rewardPreview(reward.skinId, reward.characterId),
      characterId: reward.characterId,
      skinId: reward.skinId,
      rewardKind: reward.kind,
    });
  }

  return nodes;
}

export async function getJourneyState(userId: string): Promise<JourneyStateDto> {
  const facts = await loadJourneyFacts(userId);
  const completions = evaluateMissionCompletions(facts);
  const progress = toJourneyProgressSnapshot(completions);

  const newlyUnlockedRewardIds = await syncJourneyRewards(
    userId,
    completions,
    progress,
    facts.evaUnlocked
  );

  const [charUnlocks, skinUnlocks, preference] = await Promise.all([
    prisma.userCharacterUnlock.findMany({
      where: { userId },
      select: { characterId: true },
    }),
    prisma.userSkinUnlock.findMany({
      where: { userId },
      select: { skinId: true },
    }),
    prisma.userAssistantPreference.findUnique({
      where: { userId },
      select: { selectedCharacterId: true },
    }),
  ]);

  const evaUnlocked =
    facts.evaUnlocked ||
    charUnlocks.some((u) => u.characterId === CHARACTER_IDS.eva);

  const assistantDisplayName =
    preference?.selectedCharacterId === CHARACTER_IDS.eva ? "Eva" : "Nyx";

  const nodes = buildNodes({
    completions,
    evaUnlocked,
    unlockedCharacterIds: new Set(charUnlocks.map((u) => u.characterId)),
    unlockedSkinIds: new Set(skinUnlocks.map((u) => u.skinId)),
    assistantDisplayName,
  });

  const requiredTotal = JOURNEY_MISSIONS.filter((m) => m.countsForCollection)
    .length;

  const lockedOrReady = nodes.find(
    (n) => n.kind === "reward" && (n.status === "ready" || n.status === "locked")
  );
  const nextRewardTitle =
    lockedOrReady && lockedOrReady.kind === "reward"
      ? lockedOrReady.title
      : null;

  return {
    collectionId: JOURNEY_COLLECTION_ID,
    collectionName: JOURNEY_COLLECTION_NAME,
    collectionDescription: JOURNEY_COLLECTION_DESCRIPTION,
    completedMissionCount: progress.completedMissionCount,
    totalMissionCount: requiredTotal,
    collectionComplete: progress.completedCollection1,
    nextRewardTitle,
    nodes,
    newlyCompletedMissionIds: [],
    newlyUnlockedRewardIds,
  };
}

export async function recordJourneyEvent(
  userId: string,
  eventKey: JourneyEventKey,
  metadata?: Record<string, unknown>
): Promise<void> {
  await prisma.userJourneyEvent.upsert({
    where: {
      userId_eventKey: { userId, eventKey },
    },
    create: {
      userId,
      eventKey,
      metadata: metadata as object | undefined,
    },
    update: metadata ? { metadata: metadata as object } : {},
  });
}

/** Incrementa contador de interações reais no chat (missão X de 5). */
export async function incrementAssistantInteractions(
  userId: string
): Promise<number> {
  const existing = await prisma.userJourneyEvent.findUnique({
    where: {
      userId_eventKey: {
        userId,
        eventKey: JOURNEY_EVENT_KEYS.assistantInteractions,
      },
    },
    select: { metadata: true },
  });
  const prev = (existing?.metadata as { count?: number } | null)?.count ?? 0;
  const next = Math.min(999, Number(prev) + 1);
  await prisma.userJourneyEvent.upsert({
    where: {
      userId_eventKey: {
        userId,
        eventKey: JOURNEY_EVENT_KEYS.assistantInteractions,
      },
    },
    create: {
      userId,
      eventKey: JOURNEY_EVENT_KEYS.assistantInteractions,
      metadata: { count: next },
    },
    update: { metadata: { count: next } },
  });
  return next;
}

export { JOURNEY_EVENT_KEYS };
