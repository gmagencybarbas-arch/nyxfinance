"use client";

import { memo } from "react";
import { Input } from "@/components/ui";
import { QuestionCard } from "../QuestionCard";

interface NameStepProps {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}

function NameStepBase({ value, onChange, error }: NameStepProps) {
  return (
    <QuestionCard>
      <Input
        placeholder="Seu nome ou apelido"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={error}
        autoFocus
        autoComplete="name"
        className="text-lg"
      />
    </QuestionCard>
  );
}

export const NameStep = memo(NameStepBase);
