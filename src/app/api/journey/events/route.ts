import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireFinanceUser } from "@/lib/api/requireFinanceUser";
import {
  JOURNEY_EVENT_KEYS,
  getJourneyState,
  recordJourneyEvent,
} from "@/lib/journey/journey.service";

const bodySchema = z.object({
  eventKey: z.enum([JOURNEY_EVENT_KEYS.planningViewed]),
});

/** POST registra evento da Jornada (ex.: PLANNING_VIEWED). */
export async function POST(request: NextRequest) {
  const auth = await requireFinanceUser();
  if (!auth.ok) return auth.response;

  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Evento inválido" }, { status: 400 });
    }

    await recordJourneyEvent(auth.ctx.userId, parsed.data.eventKey);
    const state = await getJourneyState(auth.ctx.userId);
    return NextResponse.json({ ok: true, state });
  } catch (e) {
    console.error("POST /api/journey/events", e);
    return NextResponse.json(
      { error: "Não foi possível registrar o evento." },
      { status: 500 }
    );
  }
}
