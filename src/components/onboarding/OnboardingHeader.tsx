"use client";

import { memo } from "react";

function OnboardingHeaderBase() {
  return (
    <header className="shrink-0 px-1 pb-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
        Criando sua Nyx
      </p>
    </header>
  );
}

export const OnboardingHeader = memo(OnboardingHeaderBase);
