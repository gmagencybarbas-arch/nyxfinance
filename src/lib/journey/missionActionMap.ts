import type { MissionId } from "./ids";
import { MISSION_IDS } from "./ids";

export type MissionAction = {
  href: string;
  ctaLabel: string;
  /** Query/hash opcional para âncora na tela destino. */
  anchor?: string;
};

/**
 * Mapa centralizado: missão → onde o usuário deve ir.
 * Adicionar nova missão = uma entrada aqui + no catálogo.
 */
export const MISSION_ACTION_MAP: Record<MissionId, MissionAction> = {
  [MISSION_IDS.completeProfile]: {
    href: "/profile",
    ctaLabel: "Completar perfil",
  },
  [MISSION_IDS.uploadProfilePicture]: {
    href: "/profile",
    ctaLabel: "Adicionar foto",
    anchor: "avatar",
  },
  [MISSION_IDS.setMonthlyIncome]: {
    href: "/profile",
    ctaLabel: "Informar renda",
    anchor: "renda",
  },
  [MISSION_IDS.createFirstExpense]: {
    href: "/nyx",
    ctaLabel: "Lançar gasto",
  },
  [MISSION_IDS.createFirstRecurringBill]: {
    href: "/profile",
    ctaLabel: "Adicionar despesa fixa",
    anchor: "recorrentes",
  },
  [MISSION_IDS.createThreeExpenses]: {
    href: "/nyx",
    ctaLabel: "Lançar gasto",
  },
  [MISSION_IDS.createFirstIncome]: {
    href: "/nyx",
    ctaLabel: "Lançar receita",
  },
  [MISSION_IDS.createFirstInstallment]: {
    href: "/nyx",
    ctaLabel: "Registrar parcelamento",
  },
  [MISSION_IDS.completeFiveAssistantInteractions]: {
    href: "/nyx",
    ctaLabel: "Conversar agora",
  },
  [MISSION_IDS.viewPlanning]: {
    href: "/planejamento",
    ctaLabel: "Ver planejamento",
  },
};

export function getMissionAction(missionId: string): MissionAction | null {
  if (missionId in MISSION_ACTION_MAP) {
    return MISSION_ACTION_MAP[missionId as MissionId];
  }
  return null;
}

export function missionHref(missionId: string): string {
  const action = getMissionAction(missionId);
  if (!action) return "/jornada";
  if (action.anchor) return `${action.href}#${action.anchor}`;
  return action.href;
}
