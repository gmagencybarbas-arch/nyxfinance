import type { FinancialInsight } from "./insightTypes";

/** Canais futuros: push, voz, memória Nyx. */
export type InsightDeliveryChannel = "ui" | "push" | "voice" | "memory";

export interface InsightDeliveryEnvelope {
  insight: FinancialInsight;
  channel: InsightDeliveryChannel;
  /** ISO — para filas e notificações agendadas. */
  createdAt: string;
  userId?: string;
}

/** Adaptador stub — hoje só UI; depois pluga fila/IA. */
export function toDeliveryEnvelope(
  insight: FinancialInsight,
  channel: InsightDeliveryChannel = "ui"
): InsightDeliveryEnvelope {
  return {
    insight,
    channel,
    createdAt: new Date().toISOString(),
  };
}
