import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ensureProfile } from "@/lib/profile/profile.service";
import { ensureUserAssistantDefaults } from "@/lib/assistant/assistant.service";

/**
 * Cria Tenant + User no Prisma para o utilizador autenticado (Supabase auth.users.id).
 * Idempotente: se já existir User com esse id, não duplica.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const existing = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, tenantId: true },
    });
    if (existing) {
      await ensureProfile(user.id).catch((e) => {
        console.error("bootstrap ensureProfile (existing)", e);
      });
      await ensureUserAssistantDefaults(user.id).catch((e) => {
        console.error("bootstrap ensureUserAssistantDefaults (existing)", e);
      });
      return NextResponse.json({
        ok: true,
        created: false,
        tenantId: existing.tenantId,
        userId: existing.id,
      });
    }

    const { tenantId } = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: "Conta pessoal" },
      });
      await tx.user.create({
        data: {
          id: user.id,
          tenantId: tenant.id,
        },
      });
      return { tenantId: tenant.id };
    });

    await ensureProfile(user.id).catch((e) => {
      console.error("bootstrap ensureProfile (new)", e);
    });
    await ensureUserAssistantDefaults(user.id).catch((e) => {
      console.error("bootstrap ensureUserAssistantDefaults (new)", e);
    });

    return NextResponse.json({
      ok: true,
      created: true,
      tenantId,
      userId: user.id,
    });
  } catch (e) {
    console.error("POST /api/auth/bootstrap", e);
    return NextResponse.json(
      { error: "Não foi possível preparar a conta." },
      { status: 500 }
    );
  }
}
