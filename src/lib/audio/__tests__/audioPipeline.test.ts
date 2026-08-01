import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  buildAudioInterpretMeta,
  buildInterpretUserPayload,
  shouldSkipLocalParserFallback,
  validateTranscriptForSend,
} from "@/lib/audio/audioInterpretBridge";
import { interpretWithDeterministicParser } from "@/lib/nyx/deterministicFallback";
import { mergePendingAfterConfirm, normalizeInterpretation } from "@/lib/nyx/normalize";
import { nyxInterpretationSchema } from "@/lib/nyx/schemas";
import type { NyxPendingBatch } from "@/lib/nyx/types";
import { MIN_AUDIO_BYTES, isAllowedAudioMime } from "@/lib/audio/constants";

describe("audio → interpret bridge", () => {
  it("rejeita transcript vazio", () => {
    expect(() => validateTranscriptForSend("")).toThrow(/entender/i);
    expect(() => validateTranscriptForSend("   \n\t  ")).toThrow(/entender/i);
  });

  it("aceita transcript integral sem reorganizar", () => {
    const raw =
      "recebi 5000 de salário e também gastei 80 no mercado ontem e ah outra coisa notebook 10x de 350";
    const meta = buildAudioInterpretMeta(raw, {
      recordedAt: "2026-08-01T12:00:00.000Z",
      locale: "pt-BR",
    });
    expect(meta.source).toBe("audio");
    expect(meta.transcript).toBe(raw);
    expect(meta.locale).toBe("pt-BR");
  });

  it("source/transcript não entram no payload da OpenAI", () => {
    const payload = buildInterpretUserPayload({
      message: "gastei 40 no café",
      currentDate: "2026-08-01T12:00:00.000Z",
      timezone: "America/Sao_Paulo",
      userCategories: ["Alimentação"],
      pendingBatch: null,
      source: "audio",
      transcript: "gastei 40 no café",
      recordedAt: "2026-08-01T12:00:00.000Z",
      locale: "pt-BR",
    });
    expect(payload).toEqual({
      message: "gastei 40 no café",
      currentDate: "2026-08-01T12:00:00.000Z",
      timezone: "America/Sao_Paulo",
      userCategories: ["Alimentação"],
      pendingBatch: null,
    });
    expect(payload).not.toHaveProperty("source");
    expect(payload).not.toHaveProperty("transcript");
  });

  it("áudio pula fallback do parser local no cliente", () => {
    expect(shouldSkipLocalParserFallback("audio")).toBe(true);
    expect(shouldSkipLocalParserFallback("text")).toBe(false);
    expect(shouldSkipLocalParserFallback(undefined)).toBe(false);
  });
});

describe("áudio — um lançamento (fallback determinístico)", () => {
  it("cria um único TRANSACTION com confirmação", async () => {
    const out = await interpretWithDeterministicParser(
      "gastei 45 no café hoje",
      ["Alimentação", "Outros"],
      null
    );
    expect(out.requiresConfirmation).toBe(true);
    expect(out.pendingBatch?.actions).toHaveLength(1);
    expect(out.pendingBatch!.actions[0].kind).toBe("TRANSACTION");
    expect(out.pendingBatch!.actions[0].transaction?.amount).toBe(45);
  });
});

describe("áudio — três lançamentos (schema / normalização)", () => {
  it("aceita lote com 3 actions e datas distintas", () => {
    const parsed = nyxInterpretationSchema.safeParse({
      intent: "CREATE_TRANSACTION",
      reply: "Encontrei três movimentos. Confere pra mim.",
      requiresConfirmation: true,
      missingFields: [],
      actions: [
        {
          actionId: "a1",
          kind: "TRANSACTION",
          confidence: 0.9,
          missingFields: [],
          transaction: {
            type: "INCOME",
            amount: 5000,
            description: "Salário",
            category: "Salário",
            occurredAt: "2026-08-01T12:00:00",
            planningType: "ACTUAL",
          },
          installment: null,
          recurringBill: null,
        },
        {
          actionId: "a2",
          kind: "TRANSACTION",
          confidence: 0.9,
          missingFields: [],
          transaction: {
            type: "EXPENSE",
            amount: 80,
            description: "Mercado",
            category: "Alimentação",
            occurredAt: "2026-07-31T12:00:00",
            planningType: "ACTUAL",
          },
          installment: null,
          recurringBill: null,
        },
        {
          actionId: "a3",
          kind: "TRANSACTION",
          confidence: 0.9,
          missingFields: [],
          transaction: {
            type: "EXPENSE",
            amount: 25,
            description: "Uber",
            category: "Transporte",
            occurredAt: "2026-07-30T12:00:00",
            planningType: "ACTUAL",
          },
          installment: null,
          recurringBill: null,
        },
      ],
      pendingBatch: null,
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const normalized = normalizeInterpretation(parsed.data);
    expect(normalized.pendingBatch?.actions).toHaveLength(3);
    const dates = normalized.pendingBatch!.actions.map(
      (a) => a.transaction?.occurredAt
    );
    expect(new Set(dates).size).toBe(3);
    expect(normalized.reply).toMatch(/três|3/i);
  });
});

describe("áudio — transação + parcelamento", () => {
  it("mantém INSTALLMENT_PLAN separado de TRANSACTION", () => {
    const parsed = nyxInterpretationSchema.safeParse({
      intent: "CREATE_TRANSACTION",
      reply: "Peguei o café e o notebook parcelado. Confere?",
      requiresConfirmation: true,
      missingFields: [],
      actions: [
        {
          actionId: "t1",
          kind: "TRANSACTION",
          confidence: 0.95,
          missingFields: [],
          transaction: {
            type: "EXPENSE",
            amount: 15,
            description: "Café",
            category: "Alimentação",
            occurredAt: "2026-08-01T12:00:00",
            planningType: "ACTUAL",
          },
          installment: null,
          recurringBill: null,
        },
        {
          actionId: "i1",
          kind: "INSTALLMENT_PLAN",
          confidence: 0.95,
          missingFields: [],
          transaction: null,
          recurringBill: null,
          installment: {
            description: "Notebook",
            category: "Outros",
            installmentAmount: 350,
            totalInstallments: 10,
            totalAmount: 3500,
            firstDueDate: "2026-09-01T12:00:00",
            trackInCommitments: false,
          },
        },
      ],
      pendingBatch: null,
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const normalized = normalizeInterpretation(parsed.data);
    const kinds = normalized.pendingBatch!.actions.map((a) => a.kind);
    expect(kinds).toEqual(["TRANSACTION", "INSTALLMENT_PLAN"]);
  });
});

describe("áudio — correção com pendingBatch", () => {
  const existing: NyxPendingBatch = {
    batchId: "batch_1",
    createdAt: "2026-08-01T10:00:00.000Z",
    actions: [
      {
        actionId: "old1",
        kind: "TRANSACTION",
        confidence: 1,
        missingFields: [],
        transaction: {
          type: "EXPENSE",
          amount: 100,
          description: "Mercado",
          category: "Alimentação",
          occurredAt: "2026-08-01T12:00:00",
          planningType: "ACTUAL",
        },
        installment: null,
        recurringBill: null,
      },
    ],
  };

  it("payload de correção reenvia o pendingBatch atual", () => {
    const payload = buildInterpretUserPayload({
      message: "na verdade o mercado foi 180",
      currentDate: "2026-08-01T12:00:00.000Z",
      timezone: "America/Sao_Paulo",
      userCategories: ["Alimentação"],
      pendingBatch: existing,
      source: "audio",
      transcript: "na verdade o mercado foi 180",
    });
    expect(payload.pendingBatch).toBe(existing);
    expect((payload.pendingBatch as NyxPendingBatch).actions[0].actionId).toBe("old1");
  });

  it("CORRECT_PENDING_ACTIONS pode substituir o lote sem duplicar ids confirmados", () => {
    const corrected = nyxInterpretationSchema.parse({
      intent: "CORRECT_PENDING_ACTIONS",
      reply: "Atualizei o valor do mercado.",
      requiresConfirmation: true,
      missingFields: [],
      actions: [
        {
          actionId: "old1",
          kind: "TRANSACTION",
          confidence: 1,
          missingFields: [],
          transaction: {
            type: "EXPENSE",
            amount: 180,
            description: "Mercado",
            category: "Alimentação",
            occurredAt: "2026-08-01T12:00:00",
            planningType: "ACTUAL",
          },
          installment: null,
          recurringBill: null,
        },
      ],
      pendingBatch: {
        batchId: "batch_1",
        createdAt: existing.createdAt,
        actions: [
          {
            actionId: "old1",
            kind: "TRANSACTION",
            confidence: 1,
            missingFields: [],
            transaction: {
              type: "EXPENSE",
              amount: 180,
              description: "Mercado",
              category: "Alimentação",
              occurredAt: "2026-08-01T12:00:00",
              planningType: "ACTUAL",
            },
            installment: null,
            recurringBill: null,
          },
        ],
      },
    });
    const normalized = normalizeInterpretation(corrected);
    expect(normalized.intent).toBe("CORRECT_PENDING_ACTIONS");
    expect(normalized.pendingBatch?.actions).toHaveLength(1);
    expect(normalized.pendingBatch?.actions[0].transaction?.amount).toBe(180);
    expect(mergePendingAfterConfirm(normalized.pendingBatch!, ["old1"])).toBeNull();
  });
});

describe("áudio casual / pergunta sem registrar", () => {
  it("schema de ASK_FINANCIAL_QUESTION não exige actions", () => {
    const parsed = nyxInterpretationSchema.safeParse({
      intent: "ASK_FINANCIAL_QUESTION",
      reply: "Seu salário cobre bem os gastos fixos se sobrar uns 20%.",
      requiresConfirmation: false,
      missingFields: [],
      actions: [],
      pendingBatch: null,
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const normalized = normalizeInterpretation(parsed.data);
    expect(normalized.actions).toHaveLength(0);
    expect(normalized.pendingBatch).toBeNull();
    expect(normalized.requiresConfirmation).toBe(false);
  });

  it("CASUAL_CONVERSATION com número não cria lote automaticamente no schema", () => {
    const parsed = nyxInterpretationSchema.safeParse({
      intent: "CASUAL_CONVERSATION",
      reply: "Haha, 5000 é um bom salário mesmo.",
      requiresConfirmation: false,
      missingFields: [],
      actions: [],
      pendingBatch: null,
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(normalizeInterpretation(parsed.data).pendingBatch).toBeNull();
  });
});

describe("validação de blob / mime (pré-transcribe)", () => {
  it("rejeita mime não-áudio e tamanho mínimo", () => {
    expect(isAllowedAudioMime("image/png")).toBe(false);
    expect(isAllowedAudioMime("audio/webm")).toBe(true);
    expect(isAllowedAudioMime("audio/mp4")).toBe(true);
    expect(MIN_AUDIO_BYTES).toBeGreaterThan(0);
  });
});

describe("clientInterpret — uma chamada por transcript", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          intent: "CREATE_TRANSACTION",
          reply: "Peguei.",
          requiresConfirmation: true,
          actions: [],
          pendingBatch: {
            batchId: "b",
            createdAt: new Date().toISOString(),
            actions: [],
          },
          missingFields: [],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    ) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("envia message=transcript integral e pendingBatch; source só no body de transporte", async () => {
    const { interpretNyxMessage } = await import("@/lib/nyx/clientInterpret");
    const transcript =
      "gastei 20 no café e ontem 40 no uber e também notebook 10x de 300";
    const pending: NyxPendingBatch = {
      batchId: "keep",
      createdAt: "2026-08-01T10:00:00.000Z",
      actions: [],
    };

    await interpretNyxMessage(transcript, pending, {
      source: "audio",
      transcript,
      recordedAt: "2026-08-01T12:00:00.000Z",
      locale: "pt-BR",
      userCategories: ["Alimentação"],
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    const body = JSON.parse(String((init as RequestInit).body));
    expect(body.message).toBe(transcript);
    expect(body.pendingBatch).toEqual(pending);
    expect(body.source).toBe("audio");
    expect(body.transcript).toBe(transcript);
  });
});
