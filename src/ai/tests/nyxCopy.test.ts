import { describe, it, expect } from "vitest";
import {
  buildInstallmentFirstDueQuestion,
  buildInstallmentConfirmSummary,
  buildSimpleTransactionConfirm,
} from "../nyxPersonality";
import { parseNyxBoldSegments } from "@/components/nyx/NyxRichText";

describe("Nyx copy — parcelamento", () => {
  it("pergunta 1ª parcela com nome do utilizador", () => {
    const msg = buildInstallmentFirstDueQuestion({
      count: 2,
      eachFormatted: "R$ 200,00",
      description: "Sapateira",
      userDisplayName: "Gabriel Silva",
    });
    expect(msg).toContain("**2 parcelas**");
    expect(msg).toContain("**R$ 200,00**");
    expect(msg).toContain("**Sapateira**");
    expect(msg).toContain(", Gabriel");
    expect(msg).toMatch(/primeira parcela/i);
    expect(msg).not.toMatch(/primeira vence quando/i);
  });

  it("resumo de confirmação do parcelamento", () => {
    const msg = buildInstallmentConfirmSummary({
      count: 2,
      eachFormatted: "R$ 200,00",
      description: "Sapateira",
      firstDueFormatted: "12/05",
    });
    expect(msg).toContain("Resumo:");
    expect(msg).toContain("**2x**");
    expect(msg).toContain("**1ª parcela**");
    expect(msg).toContain("**12/05**");
    expect(msg).toContain("**parcelamento**");
  });
});

describe("NyxRichText", () => {
  it("parse ** para negrito", () => {
    const segs = parseNyxBoldSegments("gasto de **R$ 200,00** com **Café**");
    expect(segs.some((s) => s.bold && s.text === "R$ 200,00")).toBe(true);
    expect(segs.some((s) => s.bold && s.text === "Café")).toBe(true);
  });
});

describe("confirmação simples", () => {
  it("despesa com data opcional", () => {
    const msg = buildSimpleTransactionConfirm({
      type: "expense",
      amountFormatted: "R$ 120,00",
      description: "Mercado",
      dateSuffix: " dia **05/05**",
    });
    expect(msg).toContain("**R$ 120,00**");
    expect(msg).toContain("**Mercado**");
    expect(msg).toContain("**Confirma?**");
  });
});
