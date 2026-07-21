/** IDs estáveis da Coleção MVP (`journey_collection_01`). */

export const JOURNEY_COLLECTION_ID = "journey_collection_01" as const;

export const MISSION_IDS = {
  completeProfile: "complete_profile",
  uploadProfilePicture: "upload_profile_picture",
  setMonthlyIncome: "set_monthly_income",
  createFirstExpense: "create_first_expense",
  createFirstRecurringBill: "create_first_recurring_bill",
  createThreeExpenses: "create_three_expenses",
  createFirstIncome: "create_first_income",
  createFirstInstallment: "create_first_installment",
  completeFiveAssistantInteractions: "complete_five_assistant_interactions",
  viewPlanning: "view_planning",
} as const;

/** Missões da definição anterior — inativas, não entram na trilha MVP. */
export const LEGACY_INACTIVE_MISSION_IDS = [
  "m_first_expense",
  "m_monthly_income",
  "m_first_recurring",
  "m_first_installment",
  "m_open_planning",
  "m_eva_companion",
] as const;

export const REWARD_NODE_IDS = {
  eva: "r_eva",
  evaGoodNight: "r_eva_goodnight",
  nyxBeach: "r_nyx_beach",
} as const;

export const JOURNEY_EVENT_KEYS = {
  /** PLANNING_VIEWED — idempotente ao abrir /planejamento. */
  planningViewed: "planning_viewed",
  /** Contador de interações reais no chat (metadata.count). */
  assistantInteractions: "assistant_interactions",
} as const;

/** Capítulo cujas 4 missões liberam Boa noite Eva. */
export const CHAPTER_2_MISSION_IDS = [
  MISSION_IDS.createFirstRecurringBill,
  MISSION_IDS.createThreeExpenses,
  MISSION_IDS.createFirstIncome,
  MISSION_IDS.createFirstInstallment,
] as const;

export type MissionId = (typeof MISSION_IDS)[keyof typeof MISSION_IDS];
export type RewardNodeId = (typeof REWARD_NODE_IDS)[keyof typeof REWARD_NODE_IDS];
export type JourneyEventKey =
  (typeof JOURNEY_EVENT_KEYS)[keyof typeof JOURNEY_EVENT_KEYS];
