import { NextRequest, NextResponse } from "next/server";
import { requireFinanceUser } from "@/lib/api/requireFinanceUser";
import {
  deleteRecurringBill,
  updateRecurringBill,
} from "@/lib/recurring/recurringBill.service";
import type { UpdateRecurringBillInput } from "@/lib/recurring/types";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireFinanceUser();
    if (!auth.ok) return auth.response;

    const { id } = await context.params;
    const body = (await request.json()) as UpdateRecurringBillInput;

    if (
      body.amount != null &&
      (typeof body.amount !== "number" || body.amount <= 0)
    ) {
      return NextResponse.json({ error: "amount deve ser > 0" }, { status: 400 });
    }
    if (body.dueDay != null && (body.dueDay < 1 || body.dueDay > 31)) {
      return NextResponse.json({ error: "dueDay entre 1 e 31" }, { status: 400 });
    }

    const item = await updateRecurringBill(auth.ctx.userId, id, body);
    if (!item) {
      return NextResponse.json({ error: "Recorrência não encontrada" }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (e) {
    console.error("PATCH /api/recurring-bills/[id]", e);
    const message = e instanceof Error ? e.message : "Erro ao atualizar";
    return NextResponse.json(
      {
        error: "Erro ao atualizar recorrência",
        ...(process.env.NODE_ENV === "development" ? { detail: message } : {}),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireFinanceUser();
    if (!auth.ok) return auth.response;

    const { id } = await context.params;
    const ok = await deleteRecurringBill(auth.ctx.userId, id);
    if (!ok) {
      return NextResponse.json({ error: "Recorrência não encontrada" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/recurring-bills/[id]", e);
    return NextResponse.json({ error: "Erro ao remover recorrência" }, { status: 500 });
  }
}
