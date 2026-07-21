import { NextRequest, NextResponse } from "next/server";
import { requireFinanceUser } from "@/lib/api/requireFinanceUser";
import {
  createRecurringBill,
  listRecurringBills,
} from "@/lib/recurring/recurringBill.service";
import type { CreateRecurringBillInput } from "@/lib/recurring/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireFinanceUser();
    if (!auth.ok) return auth.response;

    const items = await listRecurringBills(auth.ctx.userId);
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET /api/recurring-bills", e);
    return NextResponse.json({ error: "Erro ao listar recorrências" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireFinanceUser();
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as CreateRecurringBillInput;
    const { title, amount, category, dueDay, active } = body;

    if (
      !title ||
      typeof title !== "string" ||
      typeof amount !== "number" ||
      amount <= 0 ||
      !category ||
      typeof category !== "string" ||
      typeof dueDay !== "number"
    ) {
      return NextResponse.json(
        { error: "Campos obrigatórios: title, amount (> 0), category, dueDay" },
        { status: 400 }
      );
    }

    const item = await createRecurringBill(auth.ctx.userId, auth.ctx.tenantId, {
      title,
      amount,
      category,
      dueDay,
      active,
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("POST /api/recurring-bills", e);
    const message = e instanceof Error ? e.message : "Erro ao criar";
    return NextResponse.json(
      {
        error: "Erro ao criar recorrência",
        ...(process.env.NODE_ENV === "development" ? { detail: message } : {}),
      },
      { status: 500 }
    );
  }
}
