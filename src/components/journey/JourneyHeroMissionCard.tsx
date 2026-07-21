"use client";

import { useRouter } from "next/navigation";
import {
  CalendarRange,
  CreditCard,
  Gift,
  Receipt,
  ShoppingBag,
  Sparkles,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useReducedMotion, motion } from "framer-motion";
import { useAssistantOptional } from "@/contexts/AssistantContext";
import { SKIN_IDS } from "@/lib/assistant/ids";
import type { JourneyStateDto } from "@/lib/journey/types";
import { getMissionAction, missionHref } from "@/lib/journey/missionActionMap";
import {
  finalRewardNode,
  heroProgressLabel,
  heroRewardHint,
  pickHeroMission,
  resolveHeroVisual,
  type HeroContextualTheme,
} from "./journeyHeroMission";

const THEME_ICONS: Record<HeroContextualTheme, LucideIcon> = {
  profile: UserRound,
  income: Wallet,
  expense: ShoppingBag,
  recurring: CalendarRange,
  installment: CreditCard,
  chat: Sparkles,
  planning: CalendarRange,
  default: Receipt,
};

const HERO_SHELL =
  "relative mx-auto mt-5 w-full max-w-[1050px] overflow-hidden rounded-3xl border";

export function JourneyHeroMissionCard({
  state,
  loading,
  onDetails,
  onUseNyxBeach,
  onShareAchievement,
  onReviewCollection,
}: {
  state: JourneyStateDto | null;
  loading: boolean;
  onDetails?: (missionId: string) => void;
  onUseNyxBeach?: () => void;
  onShareAchievement?: () => void;
  onReviewCollection?: () => void;
}) {
  const router = useRouter();
  const reduced = useReducedMotion() ?? false;
  const assistant = useAssistantOptional();
  const mission = state ? pickHeroMission(state.nodes) : null;
  const action = mission ? getMissionAction(mission.id) : null;
  const rewardHint = state ? heroRewardHint(state) : null;
  const visual = state ? resolveHeroVisual(state, mission) : null;

  if (loading && !state) {
    return (
      <div
        className={`${HERO_SHELL} min-h-[240px] animate-pulse border-violet-400/10 bg-white/[0.06] sm:min-h-[280px]`}
        aria-hidden
      />
    );
  }

  if (!state) return null;

  if (state.collectionComplete) {
    return (
      <CelebrationHero
        state={state}
        reduced={reduced}
        celebrateSrc={
          assistant?.resolveVisualSrc("sucess") ||
          assistant?.activeAssets.master ||
          null
        }
        nyxBeachUnlocked={
          Boolean(assistant?.unlockedSkins.includes(SKIN_IDS.nyxBeach)) ||
          finalRewardNode(state)?.status === "claimed" ||
          finalRewardNode(state)?.status === "ready"
        }
        finalReward={finalRewardNode(state)}
        onUseNyxBeach={onUseNyxBeach}
        onShareAchievement={onShareAchievement}
        onReviewCollection={onReviewCollection}
      />
    );
  }

  if (!mission || !visual) return null;

  const go = () => router.push(missionHref(mission.id));
  const ThemeIcon = THEME_ICONS[visual.theme];
  const characterSrc =
    visual.mode === "reward_preview" && visual.reward?.preview
      ? visual.reward.preview
      : visual.mode === "active_character"
        ? assistant?.activeAssets.master || null
        : null;
  const showCharacter =
    Boolean(characterSrc) &&
    !String(characterSrc).includes("placeholder") &&
    !String(characterSrc).includes("silhouette");

  return (
    <motion.section
      className={`${HERO_SHELL} min-h-[230px] border-violet-400/20 bg-gradient-to-br from-[#2d1868]/95 via-[#1e1248]/98 to-[#12102a]/98 shadow-[0_16px_56px_rgba(88,28,135,0.35)] sm:min-h-[260px] lg:min-h-[280px] lg:overflow-visible`}
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl"
        aria-hidden
      />
      {/* Legibilidade no mobile sobre o visual */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#1a1040]/95 via-[#1a1040]/75 to-transparent sm:hidden"
        aria-hidden
      />

      <div className="relative grid min-h-[230px] grid-cols-1 sm:min-h-[260px] lg:min-h-[280px] lg:grid-cols-[3fr_2fr] lg:items-stretch">
        <div className="relative z-10 flex min-w-0 flex-col justify-center gap-2.5 p-4 pr-28 sm:gap-3 sm:p-6 sm:pr-6 lg:p-8 lg:pr-4">
          <p className="inline-flex w-fit items-center gap-1.5 rounded-full border border-violet-300/25 bg-violet-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200">
            <Sparkles className="h-3 w-3" aria-hidden />
            Missão atual
          </p>

          <h2 className="text-xl font-extrabold leading-tight text-white sm:text-2xl lg:text-3xl">
            {mission.title}
          </h2>
          <p className="max-w-xl text-sm leading-snug text-violet-100/75 line-clamp-2">
            {mission.description}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span>
              <span className="text-violet-200/55">Progresso </span>
              <span className="font-semibold text-emerald-300">
                {heroProgressLabel(mission)}
              </span>
            </span>
            {rewardHint ? (
              <span className="inline-flex items-center gap-1 text-amber-100/90">
                <Gift className="h-3.5 w-3.5 text-amber-300" aria-hidden />
                {rewardHint}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={go}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0_6px_28px_rgba(139,92,246,0.45)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 sm:w-auto"
            >
              {action?.ctaLabel ?? "Continuar"}
            </button>
            {onDetails ? (
              <button
                type="button"
                onClick={() => onDetails(mission.id)}
                className="text-sm font-medium text-violet-200/70 underline-offset-4 transition hover:text-violet-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/50 sm:px-2"
              >
                Ver detalhes
              </button>
            ) : null}
          </div>
        </div>

        {/* Visual 40% — no mobile fica no canto inferior direito */}
        <div className="pointer-events-none absolute bottom-2 right-2 z-0 sm:pointer-events-auto sm:relative sm:bottom-auto sm:right-auto sm:flex sm:items-end sm:justify-center lg:items-center lg:justify-end lg:pr-4">
          {showCharacter && characterSrc ? (
            <HeroCharacterVisual
              src={characterSrc}
              label={
                visual.mode === "reward_preview"
                  ? visual.reward?.title
                  : undefined
              }
              reduced={reduced}
            />
          ) : (
            <HeroIconVisual Icon={ThemeIcon} reduced={reduced} />
          )}
        </div>
      </div>
    </motion.section>
  );
}

function HeroIconVisual({
  Icon,
  reduced,
}: {
  Icon: LucideIcon;
  reduced: boolean;
}) {
  return (
    <div className="relative flex h-24 w-24 items-center justify-center opacity-90 sm:h-36 sm:w-36 lg:h-44 lg:w-44 lg:translate-x-2 lg:translate-y-1">
      {!reduced ? (
        <motion.span
          className="absolute inset-2 rounded-[1.75rem] bg-violet-500/25 blur-2xl"
          animate={{ opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 3, repeat: Infinity }}
          aria-hidden
        />
      ) : null}
      <span className="relative flex h-[85%] w-[85%] items-center justify-center rounded-3xl border border-violet-300/25 bg-gradient-to-br from-violet-500/35 to-fuchsia-600/20 text-violet-100 shadow-[0_8px_32px_rgba(139,92,246,0.3)]">
        <Icon
          className="h-10 w-10 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
          strokeWidth={1.5}
          aria-hidden
        />
      </span>
    </div>
  );
}

function HeroCharacterVisual({
  src,
  label,
  reduced,
}: {
  src: string;
  label?: string;
  reduced: boolean;
}) {
  return (
    <div className="relative">
      {!reduced ? (
        <motion.div
          className="absolute -inset-4 rounded-full bg-amber-400/15 blur-2xl"
          animate={{ opacity: [0.35, 0.65, 0.35] }}
          transition={{ duration: 3.2, repeat: Infinity }}
          aria-hidden
        />
      ) : null}
      <div className="relative h-28 w-24 overflow-hidden rounded-2xl border border-violet-300/25 bg-[#12081F] shadow-xl sm:h-44 sm:w-36 lg:h-52 lg:w-40 lg:translate-x-3 lg:translate-y-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover object-top"
        />
      </div>
      {label ? (
        <p className="mt-1.5 hidden text-center text-[10px] font-semibold uppercase tracking-wider text-amber-200/85 sm:block">
          {label}
        </p>
      ) : null}
    </div>
  );
}

function CelebrationHero({
  state,
  reduced,
  celebrateSrc,
  nyxBeachUnlocked,
  finalReward,
  onUseNyxBeach,
  onShareAchievement,
  onReviewCollection,
}: {
  state: JourneyStateDto;
  reduced: boolean;
  celebrateSrc: string | null;
  nyxBeachUnlocked: boolean;
  finalReward: ReturnType<typeof finalRewardNode>;
  onUseNyxBeach?: () => void;
  onShareAchievement?: () => void;
  onReviewCollection?: () => void;
}) {
  const preview =
    finalReward?.preview &&
    !finalReward.preview.includes("placeholder") &&
    !finalReward.preview.includes("silhouette")
      ? finalReward.preview
      : celebrateSrc;

  return (
    <motion.section
      className={`${HERO_SHELL} min-h-[230px] border-emerald-400/25 bg-gradient-to-br from-[#1a3d35]/90 via-[#152a40]/95 to-[#1a1040]/95 shadow-[0_12px_48px_rgba(16,185,129,0.15)] sm:min-h-[280px] lg:min-h-[300px] lg:overflow-visible`}
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-emerald-400/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#102820]/90 via-[#152a40]/70 to-transparent sm:hidden"
        aria-hidden
      />

      <div className="relative grid min-h-[230px] grid-cols-1 sm:min-h-[280px] lg:min-h-[300px] lg:grid-cols-[3fr_2fr] lg:items-center">
        <div className="relative z-10 flex min-w-0 flex-col justify-center gap-3 p-5 pr-24 sm:p-6 sm:pr-6 lg:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/90">
            Coleção concluída
          </p>
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
            Jornada concluída
          </h2>
          <p className="text-sm text-emerald-100/75">
            {finalReward
              ? `Recompensa final: ${finalReward.title}`
              : `${state.collectionName} — 100%`}
          </p>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap">
            {nyxBeachUnlocked && onUseNyxBeach ? (
              <button
                type="button"
                onClick={onUseNyxBeach}
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_6px_24px_rgba(16,185,129,0.35)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 sm:w-auto"
              >
                Usar Nyx Praia
              </button>
            ) : null}
            {onShareAchievement ? (
              <button
                type="button"
                onClick={onShareAchievement}
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-white/15 bg-white/[0.08] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60 sm:w-auto"
              >
                Compartilhar conquista
              </button>
            ) : null}
            {onReviewCollection ? (
              <button
                type="button"
                onClick={onReviewCollection}
                className="text-sm font-medium text-emerald-100/70 underline-offset-4 transition hover:text-emerald-50 hover:underline sm:px-2"
              >
                Rever a coleção
              </button>
            ) : null}
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-2 right-2 sm:relative sm:bottom-auto sm:right-auto sm:flex sm:justify-center lg:justify-end lg:pr-4">
          {preview ? (
            <HeroCharacterVisual src={preview} reduced={reduced} />
          ) : (
            <HeroIconVisual Icon={Sparkles} reduced={reduced} />
          )}
        </div>
      </div>
    </motion.section>
  );
}
