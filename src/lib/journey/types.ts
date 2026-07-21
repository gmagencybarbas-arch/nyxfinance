import type { MissionId, RewardNodeId } from "./ids";

export type MissionStatus =
  | "completed"
  | "current"
  | "available"
  | "locked";

export type RewardNodeStatus =
  | "claimed"
  | "ready"
  | "locked"
  | "coming_soon";

export type JourneyChapterDef = {
  id: string;
  name: string;
  description: string;
  order: number;
};

export type JourneyMissionDef = {
  id: MissionId;
  chapterId: string;
  order: number;
  title: string;
  description: string;
  icon:
    | "receipt"
    | "wallet"
    | "repeat"
    | "layers"
    | "calendar"
    | "heart"
    | "user"
    | "camera"
    | "message";
  /** Se true, conta para completedMissionCount / coleção. */
  countsForCollection: boolean;
  /** Alvo de progresso (ex.: 3 gastos, 5 conversas). Default 1. */
  progressTarget?: number;
  /** Missão só disponível depois que Eva está desbloqueada. */
  requiresEva?: boolean;
};

export type JourneyRewardDef = {
  id: RewardNodeId;
  /** Após N missões distintas da coleção (ex.: Eva = 3). */
  unlockAfterMissionCount?: number;
  /** Todas as missões countsForCollection da coleção. */
  requiresCollectionComplete?: boolean;
  /** Coleção específica (ex.: journey_collection_01). */
  collectionId?: string;
  /** Todas as missões de um capítulo. */
  requiresChapterId?: string;
  /** Exige personagem Eva desbloqueada. */
  requiresEva?: boolean;
  requiresMissionId?: MissionId;
  characterId?: string;
  skinId?: string;
  title: string;
  phrase: string;
  kind: "character" | "skin";
};

export type JourneyTrackNode =
  | {
      kind: "chapter";
      id: string;
      name: string;
      description: string;
    }
  | {
      kind: "mission";
      id: MissionId;
      title: string;
      description: string;
      icon: JourneyMissionDef["icon"];
      status: MissionStatus;
      progressCurrent: number;
      progressTarget: number;
      chapterId: string;
      chapterName: string;
    }
  | {
      kind: "reward";
      id: RewardNodeId;
      title: string;
      phrase: string;
      status: RewardNodeStatus;
      preview: string;
      characterId?: string;
      skinId?: string;
      rewardKind: "character" | "skin";
    };

export type JourneyStateDto = {
  collectionId: string;
  collectionName: string;
  collectionDescription: string;
  completedMissionCount: number;
  totalMissionCount: number;
  collectionComplete: boolean;
  nextRewardTitle: string | null;
  nodes: JourneyTrackNode[];
  newlyCompletedMissionIds: string[];
  newlyUnlockedRewardIds: string[];
};
