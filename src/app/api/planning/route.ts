import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { fetchPlanningPayload } from "@/lib/planning/planningQueries";
import { startOfMonth } from "@/lib/planning/planningFormat";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") ?? "", 10);
    const month = parseInt(searchParams.get("month") ?? "", 10);
    const projectionMonths = Math.min(
      12,
      Math.max(1, parseInt(searchParams.get("projectionMonths") ?? "6", 10) || 6)
    );
    const lookbackMonths = Math.min(
      3,
      Math.max(0, parseInt(searchParams.get("lookbackMonths") ?? "0", 10) || 0)
    );

    const now = new Date();
    const y = Number.isFinite(year) ? year : now.getFullYear();
    const m = Number.isFinite(month) ? month : now.getMonth() + 1;

    const rangeStart =
      lookbackMonths > 0
        ? new Date(y, m - 1 - lookbackMonths, 1)
        : startOfMonth(y, m);
    const projEndDate = new Date(y, m - 1 + projectionMonths, 0, 23, 59, 59, 999);
    const rangeEnd = projEndDate;

    const payload = await fetchPlanningPayload(authUser.id, rangeStart, rangeEnd);

    return NextResponse.json({
      ...payload,
      focusYear: y,
      focusMonth: m,
      projectionMonths,
    });
  } catch (e) {
    console.error("GET /api/planning", e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        error: "Erro ao carregar planejamento",
        ...(process.env.NODE_ENV === "development" ? { detail: message } : {}),
      },
      { status: 500 }
    );
  }
}
