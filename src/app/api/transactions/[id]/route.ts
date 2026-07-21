import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { deleteTransactionForUser } from "@/lib/transactions/deleteTransaction";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const deleted = await deleteTransactionForUser(user.id, id);
    if (!deleted) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/transactions/[id]", e);
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    let body: {
      description?: string | null;
      status?: string;
      amount?: number;
      category?: string;
      occurredAt?: string;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const raw = body.description;
    const description =
      typeof raw === "string"
        ? raw.trim() || null
        : raw === undefined
          ? undefined
          : null;

    const rawStatus = body.status;
    const status =
      rawStatus === "PENDING" || rawStatus === "COMPLETED" || rawStatus === "CANCELED"
        ? rawStatus
        : undefined;

    const amount =
      typeof body.amount === "number" && body.amount > 0 ? body.amount : undefined;

    const category =
      typeof body.category === "string" && body.category.trim()
        ? body.category.trim()
        : undefined;

    let occurredAt: Date | undefined;
    if (typeof body.occurredAt === "string" && body.occurredAt) {
      const d = new Date(body.occurredAt);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "occurredAt inválido" }, { status: 400 });
      }
      occurredAt = d;
    }

    if (
      description === undefined &&
      status === undefined &&
      amount === undefined &&
      category === undefined &&
      occurredAt === undefined
    ) {
      return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
    }

    const owned = await prisma.transaction.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
    }

    await prisma.transaction.update({
      where: { id },
      data: {
        ...(description !== undefined ? { description } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(amount !== undefined ? { amount } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(occurredAt !== undefined ? { occurredAt } : {}),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PATCH /api/transactions/[id]", e);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}
