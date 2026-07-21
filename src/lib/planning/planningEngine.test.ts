import { describe, it, expect } from "vitest";
import { buildMonthPlanning } from "./planningEngine";
import type { PlanningApiPayload } from "./types";

function planPayload(
  planId: string,
  desc: string,
  installments: { n: number; date: string; amount: number }[]
): PlanningApiPayload {
  return {
    rangeStart: "2026-01-01",
    rangeEnd: "2027-12-31",
    transactions: installments.map((p, i) => ({
      id: `${planId}-tx-${p.n}`,
      type: "EXPENSE" as const,
      amount: p.amount,
      category: "Casa",
      description: `${desc} (${p.n}/${installments.length})`,
      status: "COMPLETED",
      occurredAt: p.date,
      installmentPlanId: planId,
      installmentNumber: p.n,
      isInstallment: true,
    })),
    installmentPlans: [
      {
        id: planId,
        description: desc,
        totalInstallments: installments.length,
        installmentAmount: installments[0]?.amount ?? 0,
        firstDueDate: installments[0]!.date,
        trackInCommitments: true,
        transactions: installments.map((p) => ({
          id: `${planId}-tx-${p.n}`,
          installmentNumber: p.n,
          amount: p.amount,
          occurredAt: p.date,
          status: "COMPLETED",
          category: "Casa",
        })),
      },
    ],
    recurringBills: [],
  };
}

describe("buildMonthPlanning — parcelamentos por mês", () => {
  const payload = planPayload("p1", "Sapateira", [
    { n: 1, date: "2026-06-10T12:00:00.000Z", amount: 200 },
    { n: 2, date: "2026-07-10T12:00:00.000Z", amount: 200 },
  ]);

  it("junho: 1/2 e parcela na grade", () => {
    const view = buildMonthPlanning("2026-06", payload, null);
    expect(view.installmentPlans).toHaveLength(1);
    expect(view.installmentPlans[0]!.currentInstallment).toBe(1);
    expect(view.installmentPlans[0]!.remaining).toBe(1);
    const instRows = view.rows.filter((r) => r.type === "installment");
    expect(instRows).toHaveLength(1);
    expect(instRows[0]!.progress).toEqual({ current: 1, total: 2 });
  });

  it("julho: 2/2 e segunda parcela na grade", () => {
    const view = buildMonthPlanning("2026-07", payload, null);
    expect(view.installmentPlans).toHaveLength(1);
    expect(view.installmentPlans[0]!.currentInstallment).toBe(2);
    expect(view.installmentPlans[0]!.remaining).toBe(0);
    const instRows = view.rows.filter((r) => r.type === "installment");
    expect(instRows).toHaveLength(1);
    expect(instRows[0]!.progress).toEqual({ current: 2, total: 2 });
  });

  it("agosto: plano some dos cartões", () => {
    const view = buildMonthPlanning("2026-08", payload, null);
    expect(view.installmentPlans).toHaveLength(0);
    expect(view.rows.filter((r) => r.type === "installment")).toHaveLength(0);
  });

  it("maio: antes do plano, não aparece", () => {
    const view = buildMonthPlanning("2026-05", payload, null);
    expect(view.installmentPlans).toHaveLength(0);
  });
});

describe("buildMonthPlanning — lançamentos manuais", () => {
  const now = new Date("2026-07-01T15:00:00.000Z");

  it("despesa futura pendente entra no comprometido como previsto", () => {
    const payload: PlanningApiPayload = {
      rangeStart: "2026-07-01",
      rangeEnd: "2026-07-31",
      transactions: [
        {
          id: "manual-1",
          type: "EXPENSE",
          amount: 480,
          category: "Outros",
          description: "Cartão de Credito Nubank",
          status: "PENDING",
          occurredAt: "2026-07-05T12:00:00.000Z",
          installmentPlanId: null,
          installmentNumber: null,
          isInstallment: false,
        },
      ],
      installmentPlans: [],
      recurringBills: [],
    };

    const view = buildMonthPlanning("2026-07", payload, null, now);
    expect(view.summary.committed).toBe(480);
    expect(view.summary.expectedExpenses).toBe(480);
    const manual = view.rows.find((r) => r.type === "manual");
    expect(manual?.status).toBe("scheduled");
  });

  it("despesa já paga não entra no comprometido", () => {
    const payload: PlanningApiPayload = {
      rangeStart: "2026-07-01",
      rangeEnd: "2026-07-31",
      transactions: [
        {
          id: "manual-2",
          type: "EXPENSE",
          amount: 480,
          category: "Outros",
          description: "Cartão de Credito Nubank",
          status: "COMPLETED",
          occurredAt: "2026-07-05T12:00:00.000Z",
          installmentPlanId: null,
          installmentNumber: null,
          isInstallment: false,
        },
      ],
      installmentPlans: [],
      recurringBills: [],
    };

    const view = buildMonthPlanning("2026-07", payload, null, now);
    expect(view.summary.committed).toBe(0);
    expect(view.summary.expectedExpenses).toBe(480);
    expect(view.rows[0]?.status).toBe("paid");
  });

  it("livre estimado pode ficar negativo quando comprometido passa da receita", () => {
    const payload: PlanningApiPayload = {
      rangeStart: "2026-07-01",
      rangeEnd: "2026-07-31",
      transactions: [
        {
          id: "manual-3",
          type: "EXPENSE",
          amount: 6000,
          category: "Outros",
          description: "Gasto alto",
          status: "PENDING",
          occurredAt: "2026-07-10T12:00:00.000Z",
          installmentPlanId: null,
          installmentNumber: null,
          isInstallment: false,
        },
      ],
      installmentPlans: [],
      recurringBills: [],
    };

    const view = buildMonthPlanning(
      "2026-07",
      payload,
      { fullName: "", profession: "", jobTitle: "", salaryRange: "3k_5k", payday: 1 },
      now
    );
    expect(view.summary.expectedIncome).toBe(4000);
    expect(view.summary.committed).toBe(6000);
    expect(view.summary.freeEstimate).toBe(-2000);
    expect(view.summary.committedPercent).toBe(150);
  });
});
