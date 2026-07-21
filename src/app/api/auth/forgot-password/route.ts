import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { createServiceRoleClient } from "@/lib/supabase/admin";

/** Senha temporária: 3 letras minúsculas + 3 dígitos (determinística só quanto ao formato). */
function generateTempPassword(): string {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  let s = "";
  for (let i = 0; i < 3; i++) {
    s += letters[randomInt(letters.length)];
  }
  for (let i = 0; i < 3; i++) {
    s += digits[randomInt(digits.length)];
  }
  return s;
}

async function findUserIdByEmail(
  admin: NonNullable<ReturnType<typeof createServiceRoleClient>>,
  email: string
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  const perPage = 1000;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      console.error("listUsers", error);
      return null;
    }
    const users = data?.users ?? [];
    const hit = users.find((u) => u.email?.toLowerCase() === normalized);
    if (hit?.id) return hit.id;
    if (users.length < perPage) break;
    page += 1;
    if (page > 50) break;
  }
  return null;
}

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Corpo inválido." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Informe um e-mail válido." },
      { status: 400 }
    );
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Serviço de recuperação não configurado (SUPABASE_SERVICE_ROLE_KEY).",
      },
      { status: 503 }
    );
  }

  const userId = await findUserIdByEmail(admin, email);
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "Não encontramos este e-mail cadastrado." },
      { status: 404 }
    );
  }

  const newPassword = generateTempPassword();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    console.error("forgot-password updateUserById", error);
    return NextResponse.json(
      { ok: false, error: "Não foi possível alterar a senha. Tente de novo." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    temporaryPassword: newPassword,
    message:
      "Senha redefinida. Use a senha temporária abaixo para entrar e altere depois.",
  });
}
