"use client";

import { useState, useCallback, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useProfile } from "@/contexts/ProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { AddEntryModal } from "@/components/planning/add-entry/AddEntryModal";
import type { SalaryRange } from "@/types/profile";
import {
  markOnboardingComplete,
  saveOnboardingProfile,
  syncLocalProfileIdentity,
} from "@/lib/onboarding/completeOnboarding";
import { OnboardingBackground } from "./OnboardingBackground";
import { OnboardingHeader } from "./OnboardingHeader";
import { OnboardingProgress } from "./OnboardingProgress";
import { OnboardingStep } from "./OnboardingStep";
import { NyxGuide } from "./NyxGuide";
import { OnboardingFooter, OnboardingPrimaryCta } from "./OnboardingFooter";
import { CompletionScreen } from "./CompletionScreen";
import { getStepMeta, COMPLETION_META } from "./onboardingConfig";
import { WelcomeStep } from "./steps/WelcomeStep";
import { NaturalLanguageStep } from "./steps/NaturalLanguageStep";
import { PlanningIntroStep } from "./steps/PlanningIntroStep";
import { NameStep } from "./steps/NameStep";
import { SalaryStep } from "./steps/SalaryStep";
import { PaydayStep } from "./steps/PaydayStep";
import { GoalStep } from "./steps/GoalStep";
import { RecurringPromptStep } from "./steps/RecurringPromptStep";
import {
  type OnboardingData,
  type OnboardingStepId,
  ONBOARDING_STEP_ORDER,
  ONBOARDING_STORAGE_KEY,
  PROFILE_STEP_IDS,
} from "./types";

const DEFAULT_DATA: OnboardingData = {
  displayName: "",
  salaryRange: "3k_5k",
  payday: 1,
  financialGoal: "",
};

function loadStoredData(): OnboardingData {
  if (typeof window === "undefined") return DEFAULT_DATA;
  try {
    const s = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!s) return DEFAULT_DATA;
    const parsed = JSON.parse(s) as Partial<OnboardingData & { fullName?: string }>;
    return {
      ...DEFAULT_DATA,
      ...parsed,
      displayName: parsed.displayName ?? parsed.fullName ?? "",
    };
  } catch {
    return DEFAULT_DATA;
  }
}

function saveStoredData(data: OnboardingData) {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* noop */
  }
}

const CTA_LABELS: Partial<Record<OnboardingStepId, string>> = {
  welcome: "Começar",
  natural: "Entendi",
  planning: "Continuar",
  goal: "Continuar",
};

export function OnboardingFlow() {
  const router = useRouter();
  const profileCtx = useProfile();
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState<OnboardingData>(DEFAULT_DATA);
  const [stepIndex, setStepIndex] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [direction, setDirection] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [planningSequenceDone, setPlanningSequenceDone] = useState(false);

  useEffect(() => {
    setData(loadStoredData());
  }, []);

  const currentStepId = ONBOARDING_STEP_ORDER[stepIndex] as OnboardingStepId;
  const stepMeta = getStepMeta(currentStepId);
  const isIntro = ["welcome", "natural", "planning"].includes(currentStepId);
  const isProfile = PROFILE_STEP_IDS.includes(currentStepId);
  const isFirst = stepIndex === 0;
  const isRecurring = currentStepId === "recurring";

  useEffect(() => {
    if (currentStepId !== "planning") {
      setPlanningSequenceDone(false);
    }
  }, [currentStepId]);

  const persistProfile = useCallback(async () => {
    if (!user?.id) return;
    const bootstrapRes = await fetch("/api/auth/bootstrap", { method: "POST" });
    if (!bootstrapRes.ok) {
      const body = (await bootstrapRes.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? "Não foi possível preparar a conta");
    }
    await saveOnboardingProfile(user.id, {
      displayName: data.displayName.trim() || null,
      salaryRange: data.salaryRange as SalaryRange,
      payday: data.payday,
      financialGoal: data.financialGoal.trim() || null,
    });
    syncLocalProfileIdentity({
      displayName: data.displayName,
      salaryRange: data.salaryRange,
      payday: data.payday,
      financialGoal: data.financialGoal,
    });
    if (data.displayName.trim()) {
      profileCtx?.setDisplayName(data.displayName.trim());
    }
    profileCtx?.updateProfile({
      displayName: data.displayName.trim() || null,
      salaryRange: data.salaryRange as SalaryRange,
      payday: data.payday,
      financialGoal: data.financialGoal.trim() || null,
    });
  }, [user?.id, data, profileCtx]);

  const finishOnboarding = useCallback(
    async (redirectTo: "/planejamento" | "/nyx") => {
      if (!user?.id) return;
      setSaving(true);
      try {
        await markOnboardingComplete(user.id);
        profileCtx?.updateProfile({
          onboardingCompleted: true,
          onboardingCompletedAt: new Date().toISOString(),
        });
        router.push(redirectTo);
        router.refresh();
      } catch (e) {
        toast.show(e instanceof Error ? e.message : "Erro ao finalizar", "error");
      } finally {
        setSaving(false);
      }
    },
    [user?.id, profileCtx, router, toast]
  );

  const goNext = useCallback(async () => {
    setStepError(null);

    if (currentStepId === "name" && !data.displayName.trim()) {
      setStepError("Digite como quer ser chamado.");
      return;
    }

    saveStoredData(data);

    if (currentStepId === "goal") {
      setSaving(true);
      try {
        await persistProfile();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erro ao salvar perfil";
        setStepError(msg);
        toast.show(msg, "error");
        setSaving(false);
        return;
      }
      setSaving(false);
    }

    if (stepIndex >= ONBOARDING_STEP_ORDER.length - 1) return;

    setDirection(1);
    setStepIndex((i) => Math.min(i + 1, ONBOARDING_STEP_ORDER.length - 1));
  }, [data, currentStepId, stepIndex, persistProfile, toast]);

  const goBack = useCallback(() => {
    setStepError(null);
    setDirection(-1);
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const skipProfile = useCallback(() => {
    setStepError(null);
    setDirection(1);
    setStepIndex(ONBOARDING_STEP_ORDER.indexOf("recurring"));
  }, []);

  const handleRecurringSaved = useCallback(async () => {
    setRecurringModalOpen(false);
    if (!user?.id) return;
    try {
      await markOnboardingComplete(user.id);
      profileCtx?.updateProfile({
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString(),
      });
      setShowSuccess(true);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "Erro ao finalizar", "error");
    }
  }, [user?.id, profileCtx, toast]);

  const handleRecurringSkip = useCallback(async () => {
    toast.show(
      "Sem problemas. Você pode adicionar contas fixas depois no Planejamento ou Perfil.",
      "info"
    );
    await finishOnboarding("/nyx");
  }, [finishOnboarding, toast]);

  const handleSuccessFinish = useCallback(() => {
    router.push("/planejamento");
    router.refresh();
  }, [router]);

  if (showSuccess) {
    return (
      <div className="relative flex min-h-screen flex-col">
        <OnboardingBackground />
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">
            <OnboardingHeader />
            <OnboardingProgress currentStep={currentStepId} isCompletion />
            <div
              className="mt-6 rounded-2xl border border-white/[0.06] bg-[var(--card)]/80 p-6 backdrop-blur-xl sm:p-8"
              style={{
                boxShadow:
                  "0 0 0 1px rgba(255,255,255,0.03), 0 0 40px rgba(167,139,250,0.08)",
              }}
            >
              <NyxGuide
                message={COMPLETION_META.guideMessage}
                orbState={COMPLETION_META.orbState}
                compact
              />
              <CompletionScreen onFinish={handleSuccessFinish} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <OnboardingBackground />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md pt-2">
          <OnboardingHeader />
          <OnboardingProgress currentStep={currentStepId} />

          <div
            className="mt-6 rounded-2xl border border-white/[0.06] bg-[var(--card)]/80 p-6 backdrop-blur-xl sm:p-8"
            style={{
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.03), 0 0 40px rgba(167,139,250,0.08)",
            }}
          >
            <NyxGuide message={stepMeta.guideMessage} orbState={stepMeta.orbState} />

            <div className="mt-6">
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                <OnboardingStep stepId={currentStepId} direction={direction}>
                  {currentStepId === "welcome" && <WelcomeStep />}
                  {currentStepId === "natural" && <NaturalLanguageStep />}
                  {currentStepId === "planning" && (
                    <PlanningIntroStep onSequenceComplete={() => setPlanningSequenceDone(true)} />
                  )}
                  {currentStepId === "name" && (
                    <NameStep
                      value={data.displayName}
                      onChange={(v) => setData((d) => ({ ...d, displayName: v }))}
                      error={stepError ?? undefined}
                    />
                  )}
                  {currentStepId === "salary" && (
                    <SalaryStep
                      value={data.salaryRange}
                      onChange={(v) => setData((d) => ({ ...d, salaryRange: v }))}
                    />
                  )}
                  {currentStepId === "payday" && (
                    <PaydayStep
                      value={data.payday}
                      onChange={(v) => setData((d) => ({ ...d, payday: v }))}
                    />
                  )}
                  {currentStepId === "goal" && (
                    <GoalStep
                      value={data.financialGoal}
                      onChange={(v) => setData((d) => ({ ...d, financialGoal: v }))}
                      error={stepError ?? undefined}
                    />
                  )}
                  {currentStepId === "recurring" && (
                    <RecurringPromptStep
                      onLaunch={() => setRecurringModalOpen(true)}
                      onSkip={() => void handleRecurringSkip()}
                    />
                  )}
                </OnboardingStep>
              </AnimatePresence>
            </div>

            {!isRecurring && (
              <OnboardingFooter
                showBack={!isFirst && !isIntro}
                onBack={goBack}
                showSkip={isProfile}
                onSkip={skipProfile}
                className="mt-8"
              >
                {isProfile && (
                  <OnboardingPrimaryCta
                    label={saving ? "Salvando…" : currentStepId === "goal" ? "Continuar" : "Próximo"}
                    onClick={() => void goNext()}
                    disabled={saving}
                  />
                )}
                {isIntro && (
                  <OnboardingPrimaryCta
                    label={CTA_LABELS[currentStepId] ?? "Continuar"}
                    onClick={() => void goNext()}
                    pulse={currentStepId === "planning" && planningSequenceDone}
                    dimmed={currentStepId === "planning" && !planningSequenceDone}
                  />
                )}
              </OnboardingFooter>
            )}
          </div>
        </div>
      </div>

      <AddEntryModal
        open={recurringModalOpen}
        onClose={() => setRecurringModalOpen(false)}
        onSaved={() => void handleRecurringSaved()}
        initialKind="recurring"
      />
    </div>
  );
}
