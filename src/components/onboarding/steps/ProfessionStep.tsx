"use client";

import { memo } from "react";
import { Input } from "@/components/ui";

interface ProfessionStepProps {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}

function ProfessionStepBase({ value, onChange, error }: ProfessionStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)] text-center">
        O que você faz?
      </h2>
      <p className="text-sm text-[var(--muted-foreground)] text-center">
        Ajuda a personalizar dicas e insights.
      </p>
      <Input
        label="Profissão"
        placeholder="Ex: Desenvolvedor, Designer..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={error}
        autoFocus
      />
    </div>
  );
}

export const ProfessionStep = memo(ProfessionStepBase);
