"use client";

import { useEffect } from "react";
import { JOURNEY_EVENT_KEYS } from "@/lib/journey/ids";

/** Marca PLANNING_VIEWED ao carregar o planejamento (idempotente). */
export function JourneyOpenPlanningBeacon() {
  useEffect(() => {
    void fetch("/api/journey/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventKey: JOURNEY_EVENT_KEYS.planningViewed }),
    }).catch(() => undefined);
  }, []);

  return null;
}
