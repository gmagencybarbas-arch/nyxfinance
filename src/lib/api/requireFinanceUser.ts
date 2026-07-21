import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type FinanceUserContext = {
  userId: string;
  tenantId: string;
};

type RequireResult =
  | { ok: true; ctx: FinanceUserContext }
  | { ok: false; response: NextResponse };

export async function requireFinanceUser(): Promise<RequireResult> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Não autorizado" }, { status: 401 }),
    };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { tenantId: true },
  });

  if (!dbUser) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            "Conta financeira ainda não sincronizada. Recarregue a página ou abra o perfil uma vez.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    ctx: { userId: authUser.id, tenantId: dbUser.tenantId },
  };
}
