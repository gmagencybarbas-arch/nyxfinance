import type { OnboardingStepId } from "./types";
import { ONBOARDING_STEP_ORDER, PROFILE_STEP_IDS } from "./types";

export const ONBOARDING_TOTAL_PHASES = 6;

export interface OnboardingStepMeta {
  phaseStep: number;
  phaseLabel: string;
  guideMessage: string;
  progressPercent: number;
  orbState: "idle" | "speaking" | "thinking" | "listening";
}

export const STEP_META: Record<OnboardingStepId, OnboardingStepMeta> = {
  welcome: {
    phaseStep: 1,
    phaseLabel: "Ativando sua Nyx",
    guideMessage: "Antes de começarmos… quero que você saiba o que torna a Nyx diferente.",
    progressPercent: 100 / 6,
    orbState: "idle",
  },
  natural: {
    phaseStep: 2,
    phaseLabel: "Como a Nyx entende você",
    guideMessage: "Agora vou te mostrar como eu organizo sua vida financeira.",
    progressPercent: (100 / 6) * 2,
    orbState: "speaking",
  },
  planning: {
    phaseStep: 3,
    phaseLabel: "Conhecendo seu Planejamento",
    guideMessage: "Essa é a parte mais importante. Olha só como eu enxergo o seu mês.",
    progressPercent: (100 / 6) * 3,
    orbState: "thinking",
  },
  name: {
    phaseStep: 4,
    phaseLabel: "Configurando seu Perfil",
    guideMessage: "Como prefere ser chamado?",
    progressPercent: 58,
    orbState: "speaking",
  },
  salary: {
    phaseStep: 4,
    phaseLabel: "Configurando seu Perfil",
    guideMessage: "Qual sua renda mensal? Uso isso para projetar seu planejamento.",
    progressPercent: 66,
    orbState: "speaking",
  },
  payday: {
    phaseStep: 4,
    phaseLabel: "Configurando seu Perfil",
    guideMessage: "Que dia você costuma receber? Assim eu organizo melhor o mês.",
    progressPercent: 75,
    orbState: "speaking",
  },
  goal: {
    phaseStep: 4,
    phaseLabel: "Configurando seu Perfil",
    guideMessage: "Qual seu objetivo financeiro agora?",
    progressPercent: 83,
    orbState: "speaking",
  },
  recurring: {
    phaseStep: 5,
    phaseLabel: "Seu primeiro passo",
    guideMessage: "Vamos dar o primeiro passo? Cadastre uma conta fixa e eu começo a enxergar seu futuro.",
    progressPercent: (100 / 6) * 5,
    orbState: "listening",
  },
};

export const COMPLETION_META: OnboardingStepMeta = {
  phaseStep: 6,
  phaseLabel: "Pronto",
  guideMessage: "Perfeito. Agora eu já consigo enxergar seu futuro financeiro.",
  progressPercent: 100,
  orbState: "speaking",
};

export function getStepMeta(stepId: OnboardingStepId): OnboardingStepMeta {
  return STEP_META[stepId];
}

export function getProfileSubProgress(stepId: OnboardingStepId): number | null {
  if (!PROFILE_STEP_IDS.includes(stepId)) return null;
  const idx = PROFILE_STEP_IDS.indexOf(stepId);
  return ((idx + 1) / PROFILE_STEP_IDS.length) * 100;
}

export function getStepIndex(stepId: OnboardingStepId): number {
  return ONBOARDING_STEP_ORDER.indexOf(stepId);
}
