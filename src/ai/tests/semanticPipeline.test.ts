import { describe, it, expect } from "vitest";
import { parseTransactionInput, parseNaturalDate } from "../transactionParser";
import { handleNyxMessage } from "../nyxTransactionFlow";
import { extractSemanticDescription } from "../semantic/pipeline";
import { hasExplicitDateHint } from "../semantic/temporalExtraction";

const USER_CATEGORIES = [
  "Alimentação",
  "Transporte",
  "Casa",
  "Entretenimento",
  "Saúde",
  "Outros",
];

const REF_MAY_2026 = new Date(2026, 4, 15, 12, 0, 0);

describe("semantic pipeline — descrição", () => {
  it('“Gastei com cafe R$250 dia 10 de maio” → Café, 10/05', async () => {
    const input = "Gastei com cafe R$250 dia 10 de maio";
    expect(extractSemanticDescription(input, input.toLowerCase(), "expense")).toBe("Café");

    const result = await parseTransactionInput(input, USER_CATEGORIES, {
      refDate: REF_MAY_2026,
    });
    expect(result.status).toBe("success");
    if (result.status !== "success") return;
    expect(result.data.description).toBe("Café");
    expect(result.data.amount).toBe(-250);
    expect(result.data.date.getDate()).toBe(10);
    expect(result.data.date.getMonth()).toBe(4);
    expect(result.data.showDateInConfirmation).toBe(true);

    const flow = await handleNyxMessage(input, USER_CATEGORIES);
    expect(flow.reply).toMatch(/Café/i);
    expect(flow.reply).toMatch(/250/);
    expect(flow.reply).toMatch(/10\/05/);
    expect(flow.reply).not.toMatch(/com Maio/i);
  });

  it("acabei de pagar R$240 com café → Café", async () => {
    const input = "acabei de pagar R$240 com café";
    expect(extractSemanticDescription(input, input.toLowerCase(), "expense")).toBe("Café");
    const result = await parseTransactionInput(input, USER_CATEGORIES);
    if (result.status !== "success") return;
    expect(result.data.description).toBe("Café");
    expect(result.data.amount).toBe(-240);
  });

  it("gastei 230 com café em maio → Café, mês maio", async () => {
    const input = "gastei 230 com café em maio";
    const result = await parseTransactionInput(input, USER_CATEGORIES, {
      refDate: REF_MAY_2026,
    });
    expect(result.status).toBe("success");
    if (result.status !== "success") return;
    expect(result.data.description).toBe("Café");
    expect(result.data.date.getMonth()).toBe(4);
    expect(hasExplicitDateHint(input)).toBe(true);
  });

  it("paguei netflix 59 reais → Netflix", async () => {
    const result = await parseTransactionInput("paguei netflix 59 reais", USER_CATEGORIES);
    expect(result.status).toBe("success");
    if (result.status !== "success") return;
    expect(result.data.description).toBe("Netflix");
    expect(result.data.categorySuggested).toBe("Entretenimento");
  });

  it("mercado atacadão 450 → Atacadão (sem valor no título)", async () => {
    const result = await parseTransactionInput("mercado atacadão 450", USER_CATEGORIES);
    expect(result.status).toBe("success");
    if (result.status !== "success") return;
    expect(result.data.description).toBe("Atacadão");
    expect(result.data.description).not.toMatch(/450/);
  });

  it("uber 25 ontem → Uber", async () => {
    const result = await parseTransactionInput("uber 25 ontem", USER_CATEGORIES);
    expect(result.status).toBe("success");
    if (result.status !== "success") return;
    expect(result.data.description).toBe("Uber");
  });

  it("ifood do japonês 120 → Japonês, Alimentação", async () => {
    const result = await parseTransactionInput("ifood do japonês 120", USER_CATEGORIES);
    expect(result.status).toBe("success");
    if (result.status !== "success") return;
    expect(result.data.description).toBe("Japonês");
    expect(result.data.categorySuggested).toBe("Alimentação");
  });

  it("gastei 120 no mercado → Mercado, sem data na confirmação", async () => {
    const ref = new Date(2026, 0, 10, 12, 0, 0);
    const result = await parseTransactionInput("gastei 120 no mercado", USER_CATEGORIES, {
      refDate: ref,
    });
    expect(result.status).toBe("success");
    if (result.status !== "success") return;
    expect(result.data.description).toBe("Mercado");
    expect(result.data.showDateInConfirmation).toBe(false);

    const flow = await handleNyxMessage("gastei 120 no mercado", USER_CATEGORIES);
    expect(flow.reply).toMatch(/Mercado/i);
    expect(flow.reply).not.toMatch(/\d{2}\/\d{2}/);
  });

  it("gastei 120 no mercado dia 5 → data na confirmação", async () => {
    const ref = new Date(2026, 0, 10, 12, 0, 0);
    const result = await parseTransactionInput("gastei 120 no mercado dia 5", USER_CATEGORIES, {
      refDate: ref,
    });
    expect(result.status).toBe("success");
    if (result.status !== "success") return;
    expect(result.data.showDateInConfirmation).toBe(true);

    const flow = await handleNyxMessage("gastei 120 no mercado dia 5", USER_CATEGORIES);
    expect(flow.reply).toMatch(/Mercado/i);
    expect(flow.reply).toMatch(/\d{2}\/\d{2}/);
  });

  it("parseNaturalDate: dia 10 de maio", () => {
    const d = parseNaturalDate("dia 10 de maio", REF_MAY_2026);
    expect(d.getDate()).toBe(10);
    expect(d.getMonth()).toBe(4);
  });
});
