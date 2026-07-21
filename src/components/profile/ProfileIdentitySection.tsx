"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui";
import { SALARY_RANGE_LABELS } from "./utils/profile";
import type { ProfileIdentity, SalaryRange } from "./types";

const PAYDAY_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1);
const SALARY_OPTIONS: SalaryRange[] = [
  "ate_1k",
  "1k_3k",
  "3k_5k",
  "5k_10k",
  "10k_20k",
  "20k_plus",
];

interface ProfileIdentitySectionProps {
  value: ProfileIdentity;
  onChange: (v: ProfileIdentity) => void;
  onSave?: () => void;
  saving?: boolean;
}

function ProfileIdentitySectionBase({
  value,
  onChange,
  onSave,
  saving = false,
}: ProfileIdentitySectionProps) {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileIdentity, string>>>({});

  const handleChange = useCallback(
    (field: keyof ProfileIdentity, val: string | number | null) => {
      onChange({ ...value, [field]: val });
      if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
    },
    [value, onChange, errors]
  );

  const validatePayday = useCallback((v: number) => {
    if (v < 1 || v > 31) return "Dia entre 1 e 31";
    return undefined;
  }, []);

  const paydayError = useMemo(
    () => validatePayday(value.payday),
    [value.payday, validatePayday]
  );

  const summary = useMemo(() => {
    const name = value.fullName?.trim();
    if (name) return name;
    return "Toque para editar";
  }, [value.fullName]);

  return (
    <motion.div
      className="dashboard-card dashboard-card-glow relative overflow-hidden"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.08 }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-6 sm:py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-inset"
        aria-expanded={open}
        aria-controls="profile-identity-panel"
      >
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            Informações pessoais
          </h3>
          {!open && (
            <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
              {summary}
            </p>
          )}
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-[var(--muted-foreground)] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="profile-identity-panel"
            key="identity-fields"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-[var(--border)]/60 px-4 pb-4 pt-4 sm:px-6 sm:pb-6">
              <Input
                label="Nome completo"
                value={value.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                placeholder="Seu nome"
              />
              <Input
                label="Profissão"
                value={value.profession}
                onChange={(e) => handleChange("profession", e.target.value)}
                placeholder="Ex: Desenvolvedor"
              />
              <Input
                label="Cargo"
                value={value.jobTitle}
                onChange={(e) => handleChange("jobTitle", e.target.value)}
                placeholder="Ex: Frontend Engineer"
              />
              <div>
                <label
                  htmlFor="salary-range"
                  className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
                >
                  Faixa salarial
                </label>
                <select
                  id="salary-range"
                  value={value.salaryRange}
                  onChange={(e) =>
                    handleChange("salaryRange", e.target.value as SalaryRange)
                  }
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                >
                  {SALARY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {SALARY_RANGE_LABELS[opt]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="monthly-income"
                  className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
                >
                  Renda mensal (opcional)
                </label>
                <input
                  id="monthly-income"
                  type="text"
                  inputMode="decimal"
                  value={
                    value.monthlyIncome != null && value.monthlyIncome > 0
                      ? String(value.monthlyIncome).replace(".", ",")
                      : ""
                  }
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d,.]/g, "");
                    if (!raw.trim()) {
                      handleChange("monthlyIncome", null);
                      return;
                    }
                    const normalized = raw.replace(/\./g, "").replace(",", ".");
                    const parsed = Number(normalized);
                    handleChange(
                      "monthlyIncome",
                      Number.isFinite(parsed) && parsed > 0 ? parsed : null
                    );
                  }}
                  placeholder="Ex: 4500,00"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
                <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
                  Se informada, usa este valor no planejamento em vez da estimativa da faixa.
                </p>
              </div>
              <div>
                <label
                  htmlFor="payday"
                  className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
                >
                  Dia do pagamento
                </label>
                <select
                  id="payday"
                  value={value.payday}
                  onChange={(e) => handleChange("payday", Number(e.target.value))}
                  className={`w-full rounded-lg border px-3 py-2 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] bg-[var(--input)] ${
                    paydayError
                      ? "border-amber-500/70 focus:ring-amber-500/40"
                      : "border-[var(--border)]"
                  }`}
                >
                  {PAYDAY_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      Dia {d}
                    </option>
                  ))}
                </select>
                {paydayError && (
                  <p className="mt-1.5 text-sm text-amber-400/90" role="alert">
                    {paydayError}
                  </p>
                )}
              </div>
              <Input
                label="Meta financeira (opcional)"
                value={value.financialGoal ?? ""}
                onChange={(e) => handleChange("financialGoal", e.target.value)}
                placeholder="Ex: Guardar R$ 500/mês"
              />
              {onSave && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={saving}
                    className="rounded-lg bg-gradient-to-r from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {saving ? "Salvando…" : "Salvar"}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export const ProfileIdentitySection = memo(ProfileIdentitySectionBase);
