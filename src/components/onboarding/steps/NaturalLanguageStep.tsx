"use client";

import { AnimatedMockup } from "../AnimatedMockup";

export function NaturalLanguageStep() {
  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
        Você fala naturalmente. Eu transformo em dados organizados — em segundos.
      </p>
      <AnimatedMockup />
    </div>
  );
}
