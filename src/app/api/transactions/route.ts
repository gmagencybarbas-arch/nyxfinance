import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getTransactionsByUser } from "@/server/queries/transactions";
import { createTransaction } from "@/lib/transactions/transaction.service";

export const dynamic = "force-dynamic";

type PostBody = {
  type: "INCOME" | "EXPENSE";
  amount: number;
  category: string;
  description?: string | null;
  occurredAt: string;
  status?: "PENDING" | "COMPLETED" | "CANCELED";
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { tenantId: true },
    });
    if (!dbUser) {
      return NextResponse.json(
        {
          error:
            "Conta financeira ainda não sincronizada. Recarregue a página ou abra o perfil uma vez.",
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as PostBody;
    const { type, amount, category, description, occurredAt, status } = body;
    if (
      !type ||
      (type !== "INCOME" && type !== "EXPENSE") ||
      typeof amount !== "number" ||
      amount <= 0 ||
      !category ||
      typeof category !== "string" ||
      !occurredAt
    ) {
      return NextResponse.json(
        { error: "Campos obrigatórios: type, amount (> 0), category, occurredAt" },
        { status: 400 }
      );
    }

    const occurredAtDate = new Date(occurredAt);
    if (isNaN(occurredAtDate.getTime())) {
      return NextResponse.json(
        { error: "occurredAt inválido" },
        { status: 400 }
      );
    }

    const allowedStatus =
      status === "PENDING" || status === "COMPLETED" || status === "CANCELED"
        ? status
        : undefined;

    const { id } = await createTransaction({
      userId: authUser.id,
      tenantId: dbUser.tenantId,
      type,
      amount,
      category: category.trim(),
      description: description?.trim() ?? null,
      occurredAt: occurredAtDate,
      status: allowedStatus,
    });
    return NextResponse.json({ id });
  } catch (e) {
    console.error("POST /api/transactions", e);
    const message = e instanceof Error ? e.message : String(e);
    const dev = process.env.NODE_ENV === "development";
    const code =
      e && typeof e === "object" && "code" in e ? String((e as { code?: string }).code) : undefined;
    return NextResponse.json(
      {
        error: "Erro ao criar transação",
        ...(dev ? { detail: message, prismaCode: code } : {}),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId || userId.trim() === "") {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const from = fromParam ? new Date(fromParam) : undefined;
    const to = toParam ? new Date(toParam) : undefined;
    if (fromParam != null && (from == null || isNaN(from.getTime()))) {
      return NextResponse.json(
        { error: "Parâmetro from inválido" },
        { status: 400 }
      );
    }
    if (toParam != null && (to == null || isNaN(to.getTime()))) {
      return NextResponse.json(
        { error: "Parâmetro to inválido" },
        { status: 400 }
      );
    }

    const transactions = await getTransactionsByUser(userId, { from, to });
    return NextResponse.json(transactions);
  } catch {
    return NextResponse.json(
      { error: "Erro ao carregar transações" },
      { status: 500 }
    );
  }
}
