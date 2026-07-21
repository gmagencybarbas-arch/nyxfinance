import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ensureProfile,
  getProfile,
  updateProfile,
  type ProfilePatch,
} from "@/lib/profile/profile.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const profile = (await getProfile(user.id)) ?? (await ensureProfile(user.id));
    return NextResponse.json(profile);
  } catch (e) {
    console.error("GET /api/profile", e);
    return NextResponse.json({ error: "Erro ao carregar perfil" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = (await request.json()) as ProfilePatch;
    const profile = await updateProfile(user.id, body);
    return NextResponse.json(profile);
  } catch (e) {
    console.error("PATCH /api/profile", e);
    const message = e instanceof Error ? e.message : "Erro ao salvar perfil";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
