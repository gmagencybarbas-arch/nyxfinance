export interface OnboardingData {
  displayName: string;
  salaryRange: string;
  payday: number;
  financialGoal: string;
}

export type OnboardingStepId =
  | "welcome"
  | "natural"
  | "planning"
  | "name"
  | "salary"
  | "payday"
  | "goal"
  | "recurring";

export const ONBOARDING_STEP_ORDER: OnboardingStepId[] = [
  "welcome",
  "natural",
  "planning",
  "name",
  "salary",
  "payday",
  "goal",
  "recurring",
];

export const PROFILE_STEP_IDS: OnboardingStepId[] = [
  "name",
  "salary",
  "payday",
  "goal",
];

export const ONBOARDING_STORAGE_KEY = "nyx_onboarding_data";
export const ONBOARDING_COMPLETED_KEY = "nyx_onboarding_completed";

/** Flag de onboarding por usuário — evita herdar “já fez” de outra conta no mesmo browser. */
export function onboardingCompletedStorageKey(userId: string) {
  return `${ONBOARDING_COMPLETED_KEY}:${userId}`;
}
export const GOAL_PRESETS = [
  "Sair do aperto",
  "Organizar contas",
  "Guardar dinheiro",
  "Planejar compras",
  "Parar de parcelar sem pensar",
] as const;
