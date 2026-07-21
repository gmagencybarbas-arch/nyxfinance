import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createInstallmentPlanWithTransactions } from "@/lib/installments/installmentPlan.service";

export const dynamic = "force-dynamic";

type PostBody = {
  category: string;
  description?: string | null;
  totalInstallments: number;
  installmentAmount: number;
  firstDueDate: string;
  trackInCommitments?: boolean;
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
    const {
      category,
      description,
      totalInstallments,
      installmentAmount,
      firstDueDate,
      trackInCommitments,
    } = body;

    if (
      !category ||
      typeof totalInstallments !== "number" ||
      totalInstallments < 2 ||
      typeof installmentAmount !== "number" ||
      installmentAmount <= 0 ||
      !firstDueDate
    ) {
      return NextResponse.json(
        {
          error:
            "Campos obrigatórios: category, totalInstallments (>=2), installmentAmount (>0), firstDueDate",
        },
        { status: 400 }
      );
    }

    const firstDue = new Date(firstDueDate);
    if (isNaN(firstDue.getTime())) {
      return NextResponse.json({ error: "firstDueDate inválido" }, { status: 400 });
    }

    const { planId, firstTransactionId } = await createInstallmentPlanWithTransactions({
      userId: authUser.id,
      tenantId: dbUser.tenantId,
      category: category.trim(),
      description: description?.trim() ?? null,
      totalInstallments,
      installmentAmount,
      firstDueDate: firstDue,
      trackInCommitments: Boolean(trackInCommitments),
    });

    return NextResponse.json({ planId, firstTransactionId });
  } catch (e) {
    console.error("POST /api/installment-plans", e);
    return NextResponse.json({ error: "Erro ao criar parcelamento" }, { status: 500 });
  }
}
