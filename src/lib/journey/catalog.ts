import { CHARACTER_IDS, SKIN_IDS } from "@/lib/assistant/ids";
import { getSkinConfigById } from "@/lib/assistant/skinConfig";
import {
  JOURNEY_COLLECTION_ID,
  MISSION_IDS,
  REWARD_NODE_IDS,
} from "./ids";
import type {
  JourneyChapterDef,
  JourneyMissionDef,
  JourneyRewardDef,
} from "./types";

export const JOURNEY_COLLECTION_NAME = "Colocando a vida em ordem";
export const JOURNEY_COLLECTION_DESCRIPTION =
  "Pequenos passos pra sua vida financeira parar de parecer um acidente.";

export const JOURNEY_CHAPTERS: JourneyChapterDef[] = [
  {
    id: "ch_1",
    name: "Começando por vc",
    description: "Antes do dinheiro, precisamos saber quem tá causando tudo isso.",
    order: 1,
  },
  {
    id: "ch_2",
    name: "Organizando a bagunça",
    description: "Agora vamos descobrir o que ataca seu saldo.",
    order: 2,
  },
  {
    id: "ch_3",
    name: "Já tá parecendo organização",
    description: "Só falta provar que vc sabe voltar.",
    order: 3,
  },
];

/** As 10 missões ativas do MVP. Todas contam para a coleção. */
export const JOURNEY_MISSIONS: JourneyMissionDef[] = [
  {
    id: MISSION_IDS.completeProfile,
    chapterId: "ch_1",
    order: 1,
    title: "Quem é vc mesmo?",
    description: "Preencha as informações principais do seu perfil.",
    icon: "user",
    countsForCollection: true,
  },
  {
    id: MISSION_IDS.uploadProfilePicture,
    chapterId: "ch_1",
    order: 2,
    title: "Agora com um rosto",
    description: "Coloque uma foto pra deixar esse lugar mais seu.",
    icon: "camera",
    countsForCollection: true,
  },
  {
    id: MISSION_IDS.setMonthlyIncome,
    chapterId: "ch_1",
    order: 3,
    title: "Quanto entra por mês?",
    description: "Fala quanto vc ganha. Sem arredondar pra impressionar.",
    icon: "wallet",
    countsForCollection: true,
  },
  {
    id: MISSION_IDS.createFirstExpense,
    chapterId: "ch_1",
    order: 4,
    title: "Primeiro gasto",
    description: "Conta pra sua assistente alguma coisa que vc pagou.",
    icon: "receipt",
    countsForCollection: true,
  },
  {
    id: MISSION_IDS.createFirstRecurringBill,
    chapterId: "ch_2",
    order: 5,
    title: "Ela volta todo mês",
    description: "Cadastre uma conta fixa ou assinatura.",
    icon: "repeat",
    countsForCollection: true,
  },
  {
    id: MISSION_IDS.createThreeExpenses,
    chapterId: "ch_2",
    order: 6,
    title: "Começou a aparecer um padrão",
    description: "Registre pelo menos três despesas.",
    icon: "receipt",
    countsForCollection: true,
    progressTarget: 3,
  },
  {
    id: MISSION_IDS.createFirstIncome,
    chapterId: "ch_2",
    order: 7,
    title: "Dinheiro entrando",
    description: "Nem tudo precisa sair. Registre uma receita.",
    icon: "wallet",
    countsForCollection: true,
  },
  {
    id: MISSION_IDS.createFirstInstallment,
    chapterId: "ch_2",
    order: 8,
    title: "O presente que cobra no futuro",
    description: "Registre uma compra parcelada.",
    icon: "layers",
    countsForCollection: true,
  },
  {
    id: MISSION_IDS.completeFiveAssistantInteractions,
    chapterId: "ch_3",
    order: 9,
    title: "Converse 5 vezes com sua assistente",
    description: "Use a conversa de verdade. Ela não morde tanto.",
    icon: "message",
    countsForCollection: true,
    progressTarget: 5,
  },
  {
    id: MISSION_IDS.viewPlanning,
    chapterId: "ch_3",
    order: 10,
    title: "Olha um pouco pra frente",
    description: "Veja como seus próximos meses estão ficando.",
    icon: "calendar",
    countsForCollection: true,
  },
];

export const JOURNEY_REWARDS: JourneyRewardDef[] = [
  {
    id: REWARD_NODE_IDS.eva,
    unlockAfterMissionCount: 3,
    characterId: CHARACTER_IDS.eva,
    skinId: SKIN_IDS.evaDefault,
    title: "Eva",
    phrase: "Agora vc tem uma nova companhia.",
    kind: "character",
  },
  {
    id: REWARD_NODE_IDS.evaGoodNight,
    requiresChapterId: "ch_2",
    requiresEva: true,
    characterId: CHARACTER_IDS.eva,
    skinId: SKIN_IDS.evaFitness,
    title: "Boa noite Eva",
    phrase: "Uma versão mais noturna, elegante e acolhedora.",
    kind: "skin",
  },
  {
    id: REWARD_NODE_IDS.nyxBeach,
    requiresCollectionComplete: true,
    collectionId: JOURNEY_COLLECTION_ID,
    characterId: CHARACTER_IDS.nyx,
    skinId: SKIN_IDS.nyxBeach,
    title: "Nyx Praia",
    phrase: "Milagre. A Nyx resolveu descansar.",
    kind: "skin",
  },
];

/**
 * Ordem visual da trilha MVP:
 * 1–4 missões → Eva → 5–8 → Boa noite Eva → 9–10 → Nyx Praia
 */
export const JOURNEY_TRACK_ORDER: Array<
  | { type: "chapter"; chapterId: string }
  | { type: "mission"; missionId: (typeof MISSION_IDS)[keyof typeof MISSION_IDS] }
  | { type: "reward"; rewardId: (typeof REWARD_NODE_IDS)[keyof typeof REWARD_NODE_IDS] }
> = [
  { type: "chapter", chapterId: "ch_1" },
  { type: "mission", missionId: MISSION_IDS.completeProfile },
  { type: "mission", missionId: MISSION_IDS.uploadProfilePicture },
  { type: "mission", missionId: MISSION_IDS.setMonthlyIncome },
  { type: "mission", missionId: MISSION_IDS.createFirstExpense },
  { type: "reward", rewardId: REWARD_NODE_IDS.eva },
  { type: "chapter", chapterId: "ch_2" },
  { type: "mission", missionId: MISSION_IDS.createFirstRecurringBill },
  { type: "mission", missionId: MISSION_IDS.createThreeExpenses },
  { type: "mission", missionId: MISSION_IDS.createFirstIncome },
  { type: "mission", missionId: MISSION_IDS.createFirstInstallment },
  { type: "reward", rewardId: REWARD_NODE_IDS.evaGoodNight },
  { type: "chapter", chapterId: "ch_3" },
  { type: "mission", missionId: MISSION_IDS.completeFiveAssistantInteractions },
  { type: "mission", missionId: MISSION_IDS.viewPlanning },
  { type: "reward", rewardId: REWARD_NODE_IDS.nyxBeach },
];

export function rewardPreview(skinId?: string, characterId?: string): string {
  if (skinId) {
    const cfg = getSkinConfigById(skinId);
    return (
      cfg?.assets.storePreview ||
      cfg?.assets.master ||
      "/store/placeholders/silhouette.svg"
    );
  }
  if (characterId === CHARACTER_IDS.eva) {
    return (
      getSkinConfigById(SKIN_IDS.evaDefault)?.assets.storePreview ||
      "/store/placeholders/silhouette.svg"
    );
  }
  return "/store/placeholders/silhouette.svg";
}

export { JOURNEY_COLLECTION_ID };
