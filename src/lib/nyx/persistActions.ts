import type { NyxAction, PersistActionResult } from "./types";
import { planningTypeToStatus } from "./normalize";

async function parseError(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
  return body.detail ?? body.error ?? fallback;
}

export async function persistNyxAction(action: NyxAction): Promise<PersistActionResult> {
  try {
    if (action.kind === "SIMULATION") {
      return { actionId: action.actionId, ok: true };
    }

    if (action.kind === "TRANSACTION" && action.transaction) {
      const t = action.transaction;
      if (t.type === "TRANSFER") {
        return { actionId: action.actionId, ok: false, error: "Transferência ainda não suportada" };
      }
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: t.type,
          amount: t.amount,
          category: t.category,
          description: t.description,
          occurredAt: t.occurredAt,
          status: planningTypeToStatus(t.planningType),
        }),
      });
      if (!res.ok) {
        return {
          actionId: action.actionId,
          ok: false,
          error: await parseError(res, "Erro ao salvar lançamento"),
        };
      }
      const data = (await res.json()) as { id?: string };
      return { actionId: action.actionId, ok: true, id: data.id };
    }

    if (action.kind === "INSTALLMENT_PLAN" && action.installment) {
      const i = action.installment;
      const res = await fetch("/api/installment-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: i.category,
          description: i.description,
          totalInstallments: i.totalInstallments,
          installmentAmount: i.installmentAmount,
          firstDueDate: i.firstDueDate,
          trackInCommitments: i.trackInCommitments,
        }),
      });
      if (!res.ok) {
        return {
          actionId: action.actionId,
          ok: false,
          error: await parseError(res, "Erro ao salvar parcelamento"),
        };
      }
      const data = (await res.json()) as { firstTransactionId?: string; planId?: string };
      return { actionId: action.actionId, ok: true, id: data.firstTransactionId ?? data.planId };
    }

    if (action.kind === "RECURRING_BILL" && action.recurringBill) {
      const r = action.recurringBill;
      const res = await fetch("/api/recurring-bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: r.title,
          amount: r.amount,
          category: r.category,
          dueDay: r.dueDay,
          active: r.active,
        }),
      });
      if (!res.ok) {
        return {
          actionId: action.actionId,
          ok: false,
          error: await parseError(res, "Erro ao salvar conta fixa"),
        };
      }
      const data = (await res.json()) as { id?: string };
      return { actionId: action.actionId, ok: true, id: data.id };
    }

    return { actionId: action.actionId, ok: false, error: "Ação incompleta" };
  } catch (e) {
    return {
      actionId: action.actionId,
      ok: false,
      error: e instanceof Error ? e.message : "Erro de rede",
    };
  }
}

export async function persistNyxActions(
  actions: NyxAction[]
): Promise<PersistActionResult[]> {
  const toPersist = actions.filter((a) => a.kind !== "SIMULATION");
  const results = await Promise.allSettled(toPersist.map((a) => persistNyxAction(a)));
  return results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    return {
      actionId: toPersist[i]?.actionId ?? `unknown_${i}`,
      ok: false,
      error: r.reason instanceof Error ? r.reason.message : "Falha",
    };
  });
}
