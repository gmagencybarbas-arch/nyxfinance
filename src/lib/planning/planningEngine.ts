import type { ProfileIdentity, SalaryRange } from "@/components/profile/types";
import {
  clampDayInMonth,
  endOfMonth,
  formatDueLabel,
  monthKeyFromDate,
  monthLabel,
  parseMonthKey,
  startOfMonth,
} from "./planningFormat";
import type {
  InstallmentPlanView,
  MonthPlanningView,
  MonthSummary,
  PlanningApiInstallmentPlan,
  PlanningApiPayload,
  PlanningApiRecurringBill,
  PlanningRow,
  PlanningRowStatus,
  ProjectionMonth,
  IncomeSource,
} from "./types";

const SALARY_ESTIMATE_BRL: Record<SalaryRange, number> = {
  ate_1k: 800,
  "1k_3k": 2000,
  "3k_5k": 4000,
  "5k_10k": 7500,
  "10k_20k": 15000,
  "20k_plus": 25000,
};

export function estimateIncomeFromIdentity(identity: ProfileIdentity | null): number {
  if (!identity) return 0;
  if (identity.monthlyIncome != null && identity.monthlyIncome > 0) {
    return identity.monthlyIncome;
  }
  if (!identity.salaryRange) return 0;
  return SALARY_ESTIMATE_BRL[identity.salaryRange] ?? 0;
}

export function resolveExpectedIncome(
  incomeFromTx: number,
  identity: ProfileIdentity | null
): { expectedIncome: number; incomeSource: IncomeSource } {
  if (incomeFromTx > 0) {
    return { expectedIncome: incomeFromTx, incomeSource: "transactions" };
  }
  const estimate = estimateIncomeFromIdentity(identity);
  if (estimate <= 0) return { expectedIncome: 0, incomeSource: "none" };
  if (identity?.monthlyIncome != null && identity.monthlyIncome > 0) {
    return { expectedIncome: estimate, incomeSource: "monthly_income" };
  }
  return { expectedIncome: estimate, incomeSource: "salary_range" };
}

function txStatus(occurredAt: Date, status: string, now: Date): PlanningRowStatus {
  if (status === "CANCELED") return "pending";
  if (status === "COMPLETED") return "paid";
  if (occurredAt.getTime() > now.getTime()) return "scheduled";
  return "pending";
}

function isOpenCommitment(status: string): boolean {
  return status !== "CANCELED" && status !== "COMPLETED";
}

/**
 * Cartões de parcelamento relativos ao mês selecionado (não só “hoje”).
 * Ex.: 2x com 1ª em jun — em jul mostra 2/2; em ago some.
 */
function buildInstallmentPlanViews(
  plans: PlanningApiInstallmentPlan[],
  monthKey: string
): InstallmentPlanView[] {
  const { year, month } = parseMonthKey(monthKey);
  const monthStart = startOfMonth(year, month);
  const monthEnd = endOfMonth(year, month);
  const views: InstallmentPlanView[] = [];

  for (const plan of plans) {
    const txs = [...plan.transactions].sort(
      (a, b) => (a.installmentNumber ?? 0) - (b.installmentNumber ?? 0)
    );
    if (txs.length === 0) continue;

    const total = plan.totalInstallments;
    const firstDue = new Date(txs[0]!.occurredAt);
    const lastDue = new Date(txs[txs.length - 1]!.occurredAt);

    const overlapsPlan =
      monthStart.getTime() <= lastDue.getTime() && monthEnd.getTime() >= firstDue.getTime();
    if (!overlapsPlan) continue;

    const dueByMonthEnd = txs.filter((t) => new Date(t.occurredAt) <= monthEnd);
    const dueAfterMonth = txs.filter((t) => new Date(t.occurredAt) > monthEnd);

    const hasInstallmentThisMonth = txs.some((t) => {
      const d = new Date(t.occurredAt);
      return d >= monthStart && d <= monthEnd;
    });

    if (!hasInstallmentThisMonth && dueAfterMonth.length === 0) continue;

    const currentInstallment =
      dueByMonthEnd.length > 0
        ? Math.max(...dueByMonthEnd.map((t) => t.installmentNumber ?? 0))
        : 0;

    const remaining = dueAfterMonth.length;
    const progressPercent =
      total > 0 ? Math.round((currentInstallment / total) * 100) : 0;
    const baseDesc =
      plan.description?.replace(/\s*\(\d+\/\d+\)\s*$/, "").trim() || "Parcelamento";

    views.push({
      planId: plan.id,
      description: baseDesc,
      category: txs[0]?.category ?? "Outros",
      currentInstallment,
      totalInstallments: total,
      amountPerMonth: plan.installmentAmount,
      remaining,
      endMonthLabel: monthLabel(monthKeyFromDate(lastDue), true),
      progressPercent,
      trackInCommitments: plan.trackInCommitments,
    });
  }

  return views;
}

function activeRecurringBills(bills: PlanningApiRecurringBill[]): PlanningApiRecurringBill[] {
  return bills.filter((b) => b.active);
}

export function buildMonthPlanning(
  monthKey: string,
  payload: PlanningApiPayload,
  identity: ProfileIdentity | null,
  now = new Date()
): MonthPlanningView {
  const { year, month } = parseMonthKey(monthKey);
  const monthStart = startOfMonth(year, month);
  const monthEnd = endOfMonth(year, month);
  const rows: PlanningRow[] = [];
  const recurring = activeRecurringBills(payload.recurringBills ?? []);

  for (const r of recurring) {
    const due = clampDayInMonth(year, month, r.dueDay);
    if (due < monthStart || due > monthEnd) continue;
    rows.push({
      id: `rec-${r.id}-${monthKey}`,
      category: r.category,
      description: r.title,
      amount: r.amount,
      dueDate: due.toISOString(),
      dueLabel: formatDueLabel(due),
      status: due.getTime() > now.getTime() ? "scheduled" : "pending",
      type: "recurring",
    });
  }

  const txsInMonth = payload.transactions.filter((t) => {
    const d = new Date(t.occurredAt);
    return d >= monthStart && d <= monthEnd;
  });

  for (const t of txsInMonth) {
    if (t.type !== "EXPENSE") continue;
    const occurred = new Date(t.occurredAt);
    if (t.isInstallment && t.installmentNumber != null) {
      const plan = payload.installmentPlans.find((p) => p.id === t.installmentPlanId);
      const total = plan?.totalInstallments ?? 0;
      const baseDesc =
        t.description?.replace(/\s*\(\d+\/\d+\)\s*$/, "").trim() ||
        plan?.description?.replace(/\s*\(\d+\/\d+\)\s*$/, "").trim() ||
        "Parcela";
      rows.push({
        id: t.id,
        category: t.category,
        description: baseDesc,
        amount: t.amount,
        dueDate: t.occurredAt,
        dueLabel: formatDueLabel(occurred),
        status: txStatus(occurred, t.status, now),
        type: "installment",
        progress: total > 0 ? { current: t.installmentNumber, total } : undefined,
      });
    } else {
      const isRecurringMarker = t.description?.includes("· mensal dia ");
      if (isRecurringMarker) continue;
      rows.push({
        id: t.id,
        category: t.category,
        description: t.description?.trim() || "Lançamento",
        amount: t.amount,
        dueDate: t.occurredAt,
        dueLabel: formatDueLabel(occurred),
        status: txStatus(occurred, t.status, now),
        type: "manual",
      });
    }
  }

  rows.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const incomeFromTx = txsInMonth
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + t.amount, 0);
  const { expectedIncome, incomeSource } = resolveExpectedIncome(incomeFromTx, identity);

  const recurringCommitted = recurring.reduce((s, r) => s + r.amount, 0);

  const installmentInMonth = txsInMonth
    .filter((t) => t.type === "EXPENSE" && t.isInstallment)
    .filter((t) => t.status !== "CANCELED");

  const installmentCommitted = installmentInMonth
    .filter((t) => isOpenCommitment(t.status))
    .reduce((s, t) => s + t.amount, 0);

  const installmentExpenses = installmentInMonth.reduce((s, t) => s + t.amount, 0);

  const manualInMonth = txsInMonth
    .filter((t) => t.type === "EXPENSE" && !t.isInstallment)
    .filter((t) => !t.description?.includes("· mensal dia "))
    .filter((t) => t.status !== "CANCELED");

  const manualCommitted = manualInMonth
    .filter((t) => isOpenCommitment(t.status))
    .reduce((s, t) => s + t.amount, 0);

  const manualExpenses = manualInMonth.reduce((s, t) => s + t.amount, 0);

  const committed = recurringCommitted + installmentCommitted + manualCommitted;
  const expectedExpenses = recurringCommitted + installmentExpenses + manualExpenses;
  const freeEstimate = expectedIncome - committed;
  const committedPercent =
    expectedIncome > 0
      ? Math.round((committed / expectedIncome) * 100)
      : committed > 0
        ? 100
        : 0;

  const summary: MonthSummary = {
    expectedIncome,
    expectedExpenses,
    committed,
    freeEstimate,
    committedPercent,
    incomeSource,
  };

  return {
    monthKey,
    label: monthLabel(monthKey),
    summary,
    rows,
    installmentPlans: buildInstallmentPlanViews(payload.installmentPlans, monthKey),
  };
}

export function buildProjection(
  startMonthKey: string,
  months: number,
  payload: PlanningApiPayload,
  identity: ProfileIdentity | null,
  now = new Date()
): ProjectionMonth[] {
  let key = startMonthKey;
  let maxCommitted = 0;
  const drafts: Omit<ProjectionMonth, "isHeavy">[] = [];

  for (let i = 0; i < months; i++) {
    const view = buildMonthPlanning(key, payload, identity, now);
    drafts.push({
      monthKey: key,
      label: monthLabel(key, true),
      expectedIncome: view.summary.expectedIncome,
      committed: view.summary.committed,
      expectedExpenses: view.summary.expectedExpenses,
      freeEstimate: view.summary.freeEstimate,
    });
    maxCommitted = Math.max(maxCommitted, view.summary.committed);
    const { year, month } = parseMonthKey(key);
    const d = new Date(year, month - 1 + 1, 1);
    key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  const threshold = maxCommitted * 0.85;
  return drafts.map((d) => ({
    ...d,
    isHeavy: d.committed >= threshold && d.committed > 0 && d.freeEstimate < d.expectedIncome * 0.25,
  }));
}

/** Atualiza active de uma recorrência no payload (otimista, sem refetch). */
export function patchRecurringInPayload(
  payload: PlanningApiPayload,
  id: string,
  active: boolean
): PlanningApiPayload {
  return {
    ...payload,
    recurringBills: (payload.recurringBills ?? []).map((b) =>
      b.id === id ? { ...b, active } : b
    ),
  };
}
