import { JOURNEY_REWARDS } from "@/lib/journey/catalog";
import type { JourneyStateDto, JourneyTrackNode } from "@/lib/journey/types";
import type { MissionId } from "@/lib/journey/ids";

export type HeroMission = Extract<JourneyTrackNode, { kind: "mission" }>;
export type HeroReward = Extract<JourneyTrackNode, { kind: "reward" }>;

export type HeroVisualMode = "reward_preview" | "active_character" | "contextual";

export type HeroContextualTheme =
  | "profile"
  | "income"
  | "expense"
  | "recurring"
  | "installment"
  | "chat"
  | "planning"
  | "default";

/** Missão em destaque: current → primeira available na ordem da trilha. */
export function pickHeroMission(
  nodes: JourneyTrackNode[]
): HeroMission | null {
  const missions = nodes.filter(
    (n): n is HeroMission => n.kind === "mission"
  );

  const current = missions.find((m) => m.status === "current");
  if (current) return current;

  const available = missions.find((m) => m.status === "available");
  if (available) return available;

  return null;
}

export function heroProgressLabel(mission: HeroMission): string {
  if (mission.status === "completed") return "Concluída";
  if (mission.progressTarget > 1) {
    return `${mission.progressCurrent} de ${mission.progressTarget}`;
  }
  return "Não concluída";
}

/** Copy curta — só o essencial no hero. */
export function heroRewardHint(state: JourneyStateDto): string | null {
  if (state.collectionComplete) return null;
  if (!state.nextRewardTitle) return null;
  return `Próxima: ${state.nextRewardTitle}`;
}

export function nextRewardNode(state: JourneyStateDto): HeroReward | null {
  const reward = state.nodes.find(
    (n): n is HeroReward =>
      n.kind === "reward" &&
      n.title === state.nextRewardTitle &&
      (n.status === "locked" || n.status === "ready")
  );
  return reward ?? null;
}

export function finalRewardNode(state: JourneyStateDto): HeroReward | null {
  const reward = state.nodes.find(
    (n): n is HeroReward =>
      n.kind === "reward" &&
      (n.title === "Nyx Praia" || n.rewardKind === "skin") &&
      (n.status === "claimed" || n.status === "ready")
  );
  const beach = state.nodes.find(
    (n): n is HeroReward => n.kind === "reward" && n.title === "Nyx Praia"
  );
  return beach ?? reward ?? null;
}

/**
 * Preview grande de personagem/skin só quando a recompensa está perto
 * ou ligada diretamente à missão/capítulo atual.
 */
export function shouldShowRewardPreview(
  state: JourneyStateDto,
  mission: HeroMission | null
): boolean {
  const reward = nextRewardNode(state);
  if (!reward) return false;
  if (reward.status === "ready") return true;
  if (!mission) return false;

  const def = JOURNEY_REWARDS.find((r) => r.id === reward.id);
  if (!def) return false;

  if (def.unlockAfterMissionCount != null) {
    const remaining =
      def.unlockAfterMissionCount - state.completedMissionCount;
    // Esta missão libera, ou falta só 1
    if (remaining <= 1 && remaining > 0) return true;
  }

  if (def.requiresChapterId) {
    if (mission.chapterId === def.requiresChapterId) {
      const chapterMissions = state.nodes.filter(
        (n): n is HeroMission =>
          n.kind === "mission" && n.chapterId === def.requiresChapterId
      );
      const incomplete = chapterMissions.filter(
        (m) => m.status !== "completed"
      ).length;
      // Última missão do capítulo (ou só falta 1)
      if (incomplete <= 1) return true;
    }
  }

  if (def.requiresCollectionComplete) {
    const remaining =
      state.totalMissionCount - state.completedMissionCount;
    if (remaining <= 1) return true;
  }

  if (def.requiresMissionId && def.requiresMissionId === mission.id) {
    return true;
  }

  return false;
}

export function heroContextualTheme(
  mission: HeroMission
): HeroContextualTheme {
  const id = mission.id as MissionId;
  switch (mission.icon) {
    case "user":
    case "camera":
      return "profile";
    case "wallet":
      return id.includes("income") || id.includes("monthly")
        ? "income"
        : "income";
    case "receipt":
      return "expense";
    case "repeat":
      return "recurring";
    case "layers":
      return "installment";
    case "message":
      return "chat";
    case "calendar":
      return "planning";
    default:
      return "default";
  }
}

export function resolveHeroVisual(
  state: JourneyStateDto,
  mission: HeroMission | null
): {
  mode: HeroVisualMode;
  theme: HeroContextualTheme;
  reward: HeroReward | null;
} {
  const reward = nextRewardNode(state);
  if (mission && shouldShowRewardPreview(state, mission)) {
    return {
      mode: "reward_preview",
      theme: heroContextualTheme(mission),
      reward,
    };
  }
  if (mission && heroContextualTheme(mission) === "chat") {
    return { mode: "active_character", theme: "chat", reward };
  }
  return {
    mode: "contextual",
    theme: mission ? heroContextualTheme(mission) : "default",
    reward,
  };
}
