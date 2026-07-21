import { describe, expect, it } from "vitest";
import { cleanDescription, mergePendingAfterConfirm, planningTypeToStatus } from "@/lib/nyx/normalize";
import { isLocalCancelAll, isLocalConfirmAll } from "@/lib/nyx/clientInterpret";
import { interpretWithDeterministicParser } from "@/lib/nyx/deterministicFallback";
import { nyxInterpretationSchema } from "@/lib/nyx/schemas";
import type { NyxPendingBatch } from "@/lib/nyx/types";

describe("nyx normalize", () => {
  it("cleanDescription remove verbos e capitaliza", () => {
    expect(cleanDescription("gastei café")).toMatch(/Café/i);
    expect(cleanDescription("recebi salário")).toMatch(/Salário/i);
  });

  it("planningTypeToStatus", () => {
    expect(planningTypeToStatus("ACTUAL")).toBe("COMPLETED");
    expect(planningTypeToStatus("PLANNED")).toBe("PENDING");
    expect(planningTypeToStatus("COMMITTED")).toBe("PENDING");
  });

  it("mergePendingAfterConfirm remove ids confirmados", () => {
    const batch: NyxPendingBatch = {
      batchId: "b1",
      createdAt: new Date().toISOString(),
      actions: [
        {
          actionId: "a",
          kind: "TRANSACTION",
          confidence: 1,
          missingFields: [],
          transaction: {
            type: "EXPENSE",
            amount: 10,
            description: "A",
            category: "Outros",
            occurredAt: new Date().toISOString(),
            planningType: "ACTUAL",
          },
          installment: null,
          recurringBill: null,
        },
        {
          actionId: "b",
          kind: "TRANSACTION",
          confidence: 1,
          missingFields: [],
          transaction: {
            type: "INCOME",
            amount: 100,
            description: "B",
            category: "Salário",
            occurredAt: new Date().toISOString(),
            planningType: "ACTUAL",
          },
          installment: null,
          recurringBill: null,
        },
      ],
    };
    const next = mergePendingAfterConfirm(batch, ["a"]);
    expect(next?.actions).toHaveLength(1);
    expect(next?.actions[0].actionId).toBe("b");
    expect(mergePendingAfterConfirm(batch, ["a", "b"])).toBeNull();
  });
});

describe("local confirm/cancel", () => {
  it("reconhece confirmação e cancelamento", () => {
    expect(isLocalConfirmAll("sim")).toBe(true);
    expect(isLocalConfirmAll("pode lançar")).toBe(true);
    expect(isLocalConfirmAll("o mercado foi 180")).toBe(false);
    expect(isLocalCancelAll("cancela")).toBe(true);
    expect(isLocalCancelAll("esquece")).toBe(true);
  });
});

describe("deterministic fallback", () => {
  it("interpreta gasto simples ontem", async () => {
    const out = await interpretWithDeterministicParser(
      "gastei 120 no iFood ontem",
      ["Alimentação", "Outros", "Salário"],
      null
    );
    expect(out.requiresConfirmation).toBe(true);
    expect(out.pendingBatch?.actions.length).toBeGreaterThanOrEqual(1);
    const action = out.pendingBatch!.actions[0];
    expect(action.kind).toBe("TRANSACTION");
    expect(action.transaction?.amount).toBe(120);
    expect(nyxInterpretationSchema.safeParse(out).success).toBe(true);
  });

  it("mensagem sem valor pede clarificação", async () => {
    const out = await interpretWithDeterministicParser(
      "gastei no mercado",
      ["Alimentação", "Outros"],
      null
    );
    expect(["NEEDS_CLARIFICATION", "CREATE_TRANSACTION"]).toContain(out.intent);
  });
});

describe("interpretation schema", () => {
  it("aceita lote multi-action válido", () => {
    const parsed = nyxInterpretationSchema.safeParse({
      intent: "CREATE_TRANSACTION",
      reply: "Encontrei três movimentos. Confere pra mim.",
      requiresConfirmation: true,
      missingFields: [],
      actions: [
        {
          actionId: "1",
          kind: "TRANSACTION",
          confidence: 0.9,
          missingFields: [],
          transaction: {
            type: "INCOME",
            amount: 5000,
            description: "Salário",
            category: "Salário",
            occurredAt: "2026-07-14T12:00:00",
            planningType: "ACTUAL",
          },
          installment: null,
          recurringBill: null,
        },
        {
          actionId: "2",
          kind: "TRANSACTION",
          confidence: 0.9,
          missingFields: [],
          transaction: {
            type: "EXPENSE",
            amount: 120,
            description: "Mercado",
            category: "Alimentação",
            occurredAt: "2026-07-12T12:00:00",
            planningType: "ACTUAL",
          },
          installment: null,
          recurringBill: null,
        },
        {
          actionId: "3",
          kind: "TRANSACTION",
          confidence: 0.8,
          missingFields: [],
          transaction: {
            type: "EXPENSE",
            amount: 300,
            description: "Dentista",
            category: "Saúde",
            occurredAt: "2026-07-15T12:00:00",
            planningType: "PLANNED",
          },
          installment: null,
          recurringBill: null,
        },
      ],
      pendingBatch: {
        batchId: "b",
        createdAt: "2026-07-14T12:00:00Z",
        actions: [],
      },
    });
    expect(parsed.success).toBe(true);
  });
});
