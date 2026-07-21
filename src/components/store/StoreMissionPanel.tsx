"use client";

import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { Button } from "@/components/ui";
import type { StoreItem } from "@/lib/assistant/types";

interface StoreMissionPanelProps {
  item: StoreItem | null;
  selecting: boolean;
  onUse: () => void;
}

function statusCopy(item: StoreItem): { label: string; detail: string } {
  if (item.status === "in_use") {
    return { label: "Em uso", detail: item.description };
  }
  if (item.status === "coming_soon") {
    return {
      label: "Em breve",
      detail: item.unlockRequirement?.description ?? item.description,
    };
  }
  if (item.status === "locked") {
    return {
      label: "Bloqueada",
      detail: item.unlockRequirement?.description ?? "Complete a Jornada para liberar.",
    };
  }
  return { label: "Disponível", detail: item.description };
}

export function StoreMissionPanel({
  item,
  selecting,
  onUse,
}: StoreMissionPanelProps) {
  if (!item) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[var(--card)]/80 p-5">
        <p className="text-sm text-[var(--muted-foreground)]">
          Selecione um item na galeria.
        </p>
      </div>
    );
  }

  const status = statusCopy(item);
  const req = item.unlockRequirement;
  const locked =
    item.status === "locked" ||
    item.status === "coming_soon" ||
    item.status === "unavailable";
  const inUse = item.status === "in_use";
  const progressPct =
    req && req.target > 0
      ? Math.min(100, Math.round((req.current / req.target) * 100))
      : 0;

  return (
    <aside
      className="flex h-full flex-col rounded-2xl border border-white/[0.07] bg-[var(--card)]/90 p-5 sm:p-6"
      aria-live="polite"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-violet-300/80">
        {item.categoryLabel}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {item.name}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
        {status.detail}
      </p>

      <div className="mt-4 inline-flex w-fit rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-[var(--foreground)]">
        {status.label}
      </div>

      {locked && req && (
        <div className="mt-6 space-y-3">
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">{req.title}</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {req.description}
            </p>
          </div>

          {req.target > 1 && (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
                <span>
                  {req.current} de {req.target} missões
                </span>
                <span>{progressPct}%</span>
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
                role="progressbar"
                aria-valuenow={req.current}
                aria-valuemin={0}
                aria-valuemax={req.target}
              >
                <div
                  className="h-full rounded-full bg-violet-400/80 transition-[width] duration-200"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          <ul className="space-y-2">
            {req.summaryLines.slice(0, 3).map((line) => {
              const done =
                req.available ||
                (req.current > 0 &&
                  req.summaryLines.indexOf(line) < req.current);
              return (
                <li
                  key={line}
                  className="flex items-start gap-2 text-xs text-[var(--muted-foreground)]"
                >
                  {done && req.available ? (
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  ) : (
                    <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-50" />
                  )}
                  <span>{line}</span>
                </li>
              );
            })}
          </ul>

          <p className="text-[11px] text-[var(--muted-foreground)]">
            Ver todas na Jornada
          </p>
        </div>
      )}

      <div className="mt-auto pt-6">
        {locked ? (
          <Link
            href="/jornada"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
          >
            {item.status === "coming_soon" ? "Ver Jornada" : "Ver missões"}
          </Link>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            loading={selecting}
            disabled={inUse || selecting}
            onClick={onUse}
            className="min-h-11"
          >
            {inUse ? "Selecionada" : `Usar ${item.name}`}
          </Button>
        )}
      </div>
    </aside>
  );
}
