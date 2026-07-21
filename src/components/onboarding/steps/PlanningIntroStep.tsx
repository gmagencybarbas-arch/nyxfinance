"use client";

import { AnimatedTimeline } from "../AnimatedTimeline";

interface PlanningIntroStepProps {
  onSequenceComplete?: () => void;
}

export function PlanningIntroStep({ onSequenceComplete }: PlanningIntroStepProps) {
  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
        Um gasto de hoje impacta o que sobra no fim do mês. Veja como eu conecto tudo.
      </p>
      <AnimatedTimeline onSequenceComplete={onSequenceComplete} />
    </div>
  );
}
