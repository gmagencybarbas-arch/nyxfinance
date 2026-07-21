import { describe, it, expect } from "vitest";
import {
  parseTransactionInput,
  parseNaturalDate,
  suggestCategory,
  type ParseResult,
} from "../transactionParser";

const USER_CATEGORIES = [
  "Alimentação",
  "Transporte",
  "Entretenimento",
  "Casa",
  "Saúde",
  "Outros",
];

describe("transactionParser", () => {
  describe("expense parsing", () => {
    it("parses 'gastei 120 no mercado ontem'", async () => {
      const result = await parseTransactionInput(
        "gastei 120 no mercado ontem",
        USER_CATEGORIES
      );
      expect(result.status).toBe("success");
      if (result.status !== "success") return;
      expect(result.data.amount).toBe(-120);
      expect(result.data.type).toBe("expense");
      expect(result.data.categorySuggested).toBe("Alimentação");
      expect(result.data.confidence).toBeGreaterThanOrEqual(0.75);
    });

    it("parses 'uber 23,90 hoje'", async () => {
      const result = await parseTransactionInput(
        "uber 23,90 hoje",
        USER_CATEGORIES
      );
      expect(result.status).toBe("success");
      if (result.status !== "success") return;
      expect(result.data.amount).toBe(-23.9);
      expect(result.data.type).toBe("expense");
      expect(result.data.categorySuggested).toBe("Transporte");
    });

    it("parses 'ifood 45 reais'", async () => {
      const result = await parseTransactionInput(
        "ifood 45 reais",
        USER_CATEGORIES
      );
      expect(result.status).toBe("success");
      if (result.status !== "success") return;
      expect(result.data.amount).toBe(-45);
      expect(result.data.type).toBe("expense");
      expect(result.data.categorySuggested).toBe("Alimentação");
    });

    it("parses 'paguei 80 na academia dia 5' with category Saúde", async () => {
      const result = await parseTransactionInput(
        "paguei 80 na academia dia 5",
        USER_CATEGORIES
      );
      expect(result.status).not.toBe("error");
      if (result.status === "error") return;
      expect(result.data.amount).toBe(-80);
      expect(result.data.type).toBe("expense");
      expect(result.data.categorySuggested).toBe("Saúde");
    });

    it("returns error for 'paguei academia dia 5' (no amount)", async () => {
      const result = await parseTransactionInput(
        "paguei academia dia 5",
        USER_CATEGORIES
      );
      expect(result.status).toBe("error");
    });
  });

  describe("income parsing", () => {
    it("parses R$1000 without truncating to 100", async () => {
      const result = await parseTransactionInput(
        "Recebi R$1000 hoje! pagamento do luiz",
        USER_CATEGORIES
      );
      expect(result.status).toBe("success");
      if (result.status !== "success") return;
      expect(result.data.amount).toBe(1000);
    });

    it("parses 'recebi 3500 de salário'", async () => {
      const result = await parseTransactionInput(
        "recebi 3500 de salário",
        USER_CATEGORIES
      );
      expect(result.status).toBe("success");
      if (result.status !== "success") return;
      expect(result.data.amount).toBe(3500);
      expect(result.data.type).toBe("income");
      expect(result.data.confidence).toBeGreaterThanOrEqual(0.75);
    });

    it("parses 'ganhei 500 sexta passada'", async () => {
      const result = await parseTransactionInput(
        "ganhei 500 sexta passada",
        USER_CATEGORIES
      );
      expect(result.status).toBe("success");
      if (result.status !== "success") return;
      expect(result.data.amount).toBe(500);
      expect(result.data.type).toBe("income");
    });
  });

  describe("Brazilian decimal", () => {
    it("accepts comma decimal 45,90", async () => {
      const result = await parseTransactionInput(
        "gastei 45,90 no mercado",
        USER_CATEGORIES
      );
      expect(result.status).not.toBe("error");
      if (result.status === "error") return;
      expect(result.data.amount).toBe(-45.9);
    });

    it("accepts dot decimal 45.90", async () => {
      const result = await parseTransactionInput(
        "gastei 45.90 no mercado",
        USER_CATEGORIES
      );
      expect(result.status).not.toBe("error");
      if (result.status === "error") return;
      expect(result.data.amount).toBe(-45.9);
    });

    it("accepts R$ prefix", async () => {
      const result = await parseTransactionInput(
        "R$ 99,50 farmácia",
        USER_CATEGORIES
      );
      expect(result.status).not.toBe("error");
      if (result.status === "error") return;
      expect(result.data.amount).toBe(-99.5);
    });
  });

  describe("date words", () => {
    it("parseNaturalDate: hoje returns today", () => {
      const d = parseNaturalDate("algo hoje");
      const today = new Date();
      expect(d.getFullYear()).toBe(today.getFullYear());
      expect(d.getMonth()).toBe(today.getMonth());
      expect(d.getDate()).toBe(today.getDate());
    });

    it("parseNaturalDate: ontem returns yesterday", () => {
      const d = parseNaturalDate("gastei ontem");
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(d.getDate()).toBe(yesterday.getDate());
      expect(d.getMonth()).toBe(yesterday.getMonth());
    });

    it("parseNaturalDate: dia 5 returns day 5 of current month", () => {
      const d = parseNaturalDate("dia 5");
      const now = new Date();
      expect(d.getDate()).toBe(5);
      expect(d.getMonth()).toBe(now.getMonth());
      expect(d.getFullYear()).toBe(now.getFullYear());
    });

    it("parseNaturalDate: dia 05/02 returns 5 Feb", () => {
      const d = parseNaturalDate("dia 05/02");
      expect(d.getDate()).toBe(5);
      expect(d.getMonth()).toBe(1);
    });
  });

  describe("needs_confirmation case", () => {
    it("returns needs_confirmation when type is unclear", async () => {
      const result = await parseTransactionInput(
        "120 reais",
        USER_CATEGORIES
      );
      expect(result.status).toBe("needs_confirmation");
      if (result.status !== "needs_confirmation") return;
      expect(result.data.amount).toBeDefined();
      expect(result.missing).toContain("tipo (receita ou despesa)");
    });

    it("returns needs_confirmation when confidence in range 0.4–0.74", async () => {
      const result = await parseTransactionInput(
        "50 reais algo genérico",
        USER_CATEGORIES
      );
      expect(["success", "needs_confirmation"]).toContain(result.status);
      if (result.status === "error") return;
      expect(result.data.confidence).toBeLessThanOrEqual(1);
      expect(result.data.confidence).toBeGreaterThanOrEqual(0);
    });
  });

  describe("unknown input error", () => {
    it("returns error when no amount", async () => {
      const result = await parseTransactionInput(
        "comprei algo no mercado",
        USER_CATEGORIES
      );
      expect(result.status).toBe("error");
      if (result.status !== "error") return;
      expect(result.reason).toMatch(/valor|não encontrado/i);
    });

    it("returns error for empty input", async () => {
      const result = await parseTransactionInput("", USER_CATEGORIES);
      expect(result.status).toBe("error");
      if (result.status !== "error") return;
      expect(result.reason).toBeDefined();
    });

    it("returns error for whitespace-only input", async () => {
      const result = await parseTransactionInput("   ", USER_CATEGORIES);
      expect(result.status).toBe("error");
    });
  });

  describe("suggestCategory", () => {
    it("matches keyword mercado to Alimentação", () => {
      expect(suggestCategory("gastei no mercado", USER_CATEGORIES)).toBe(
        "Alimentação"
      );
    });

    it("matches uber to Transporte", () => {
      expect(suggestCategory("uber 20", USER_CATEGORIES)).toBe("Transporte");
    });

    it("is case insensitive", () => {
      expect(suggestCategory("MERCADO", USER_CATEGORIES)).toBe("Alimentação");
    });

    it("returns null when no match", () => {
      expect(suggestCategory("xyz 100", USER_CATEGORIES)).toBeNull();
    });
  });

  describe("safety and determinism", () => {
    it("never invents amount", async () => {
      const result = await parseTransactionInput(
        "gastei no mercado ontem",
        USER_CATEGORIES
      );
      expect(result.status).toBe("error");
    });

    it("same input gives same result", async () => {
      const a = await parseTransactionInput(
        "recebi 3500 de salário",
        USER_CATEGORIES
      );
      const b = await parseTransactionInput(
        "recebi 3500 de salário",
        USER_CATEGORIES
      );
      expect(a.status).toBe(b.status);
      if (a.status === "success" && b.status === "success") {
        expect(a.data.amount).toBe(b.data.amount);
        expect(a.data.type).toBe(b.data.type);
      }
    });
  });

  describe("semantic UX (descrição, datas, categorias)", () => {
    const REF_WED_JAN_14_2026 = new Date(2026, 0, 14, 12, 0, 0);

    it('Comprei macarrão segunda feira 120 → Macarrão, Alimentação, segunda da semana', async () => {
      const result = await parseTransactionInput(
        "Comprei macarrão segunda feira 120",
        USER_CATEGORIES,
        { refDate: REF_WED_JAN_14_2026 }
      );
      expect(result.status).toBe("success");
      if (result.status !== "success") return;
      expect(result.data.description).toBe("Macarrão");
      expect(result.data.categorySuggested).toBe("Alimentação");
      expect(result.data.date.getFullYear()).toBe(2026);
      expect(result.data.date.getMonth()).toBe(0);
      expect(result.data.date.getDate()).toBe(12);
    });

    it("Gastei R$204 terça passada → terça da semana anterior (ref 14/01/2026 qua)", () => {
      const d = parseNaturalDate("Gastei R$204 terça passada", REF_WED_JAN_14_2026);
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(0);
      expect(d.getDate()).toBe(6);
    });

    it("Recebi salário sexta → receita, Salário, categoria Salário", async () => {
      const cats = [...USER_CATEGORIES, "Salário", "Freelance"];
      const ref = new Date(2026, 0, 8, 12, 0, 0);
      const result = await parseTransactionInput("Recebi salário sexta 2500", cats, {
        refDate: ref,
      });
      expect(result.status).toBe("success");
      if (result.status !== "success") return;
      expect(result.data.type).toBe("income");
      expect(result.data.description).toBe("Salário");
      expect(result.data.categorySuggested).toBe("Salário");
      expect(result.data.date.getDate()).toBe(9);
    });

    it("Uber ontem 23 → Transporte, Uber", async () => {
      const result = await parseTransactionInput("Uber ontem 23", USER_CATEGORIES);
      expect(result.status).toBe("success");
      if (result.status !== "success") return;
      expect(result.data.categorySuggested).toBe("Transporte");
      expect(result.data.description).toBe("Uber");
    });

    it("mercado atacadão 400 → Alimentação, Atacadão", async () => {
      const result = await parseTransactionInput(
        "mercado atacadão 400",
        USER_CATEGORIES
      );
      expect(result.status).toBe("success");
      if (result.status !== "success") return;
      expect(result.data.categorySuggested).toBe("Alimentação");
      expect(result.data.description).toBe("Atacadão");
    });

    it("paguei netflix sem valor → erro pedindo valor", async () => {
      const result = await parseTransactionInput("paguei netflix", USER_CATEGORIES);
      expect(result.status).toBe("error");
      if (result.status !== "error") return;
      expect(result.reason).toMatch(/valor|não encontrado/i);
    });

    it("parcelei notebook em 10x de 350 → parcelas, aguarda 1ª data", async () => {
      const result = await parseTransactionInput(
        "parcelei notebook em 10x de 350",
        USER_CATEGORIES
      );
      expect(result.status).toBe("success");
      if (result.status !== "success") return;
      expect(result.data.installmentPlan?.count).toBe(10);
      expect(result.data.installmentPlan?.amountEach).toBe(350);
      expect(result.data.installmentAwaitingFirstDue).toBe(true);
      expect(result.data._nyxAwaiting).toBe("installment_first_due");
      expect(result.data.amount).toBe(-350);
    });

    it("ps5 em 3x → pergunta valor da parcela", async () => {
      const result = await parseTransactionInput("ps5 em 3x", USER_CATEGORIES);
      expect(result.status).toBe("success");
      if (result.status !== "success") return;
      expect(result.data._nyxAwaiting).toBe("installment_amount");
      expect(result.data.pendingInstallmentCount).toBe(3);
    });

    it("iphone parcelado 500 → pergunta número de parcelas", async () => {
      const result = await parseTransactionInput(
        "iphone parcelado 500",
        USER_CATEGORIES
      );
      expect(result.status).toBe("success");
      if (result.status !== "success") return;
      expect(result.data._nyxAwaiting).toBe("installment_count");
      expect(result.data.pendingInstallmentAmountEach).toBe(500);
    });

    it("comprei um ps5 parcelado hoje R$120 em 3 parcelas → tudo inferido, aguarda 1ª data", async () => {
      const result = await parseTransactionInput(
        "comprei um ps5 parcelado hoje R$120 em 3 parcelas",
        USER_CATEGORIES
      );
      expect(result.status).toBe("success");
      if (result.status !== "success") return;
      expect(result.data.installmentPlan?.count).toBe(3);
      expect(result.data.installmentPlan?.amountEach).toBe(120);
      expect(result.data.type).toBe("expense");
      expect(result.data._nyxAwaiting).toBe("installment_first_due");
    });

    it("todo dia 5 pago aluguel 1500 → recorrente mensal dia 5", async () => {
      const ref = new Date(2026, 0, 3, 12, 0, 0);
      const result = await parseTransactionInput(
        "todo dia 5 pago aluguel 1500",
        USER_CATEGORIES,
        { refDate: ref }
      );
      expect(result.status).toBe("success");
      if (result.status !== "success") return;
      expect(result.data.recurringBill?.dayOfMonth).toBe(5);
      expect(result.data._nyxAwaiting).toBe("recurring_choice");
      expect(result.data.amount).toBe(-1500);
      expect(result.data.categorySuggested).toBe("Casa");
    });
  });
});
