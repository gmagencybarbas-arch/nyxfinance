import type { SalaryRange } from "@/types/profile";
import {
  ONBOARDING_COMPLETED_KEY,
  onboardingCompletedStorageKey,
} from "@/components/onboarding/types";

export interface OnboardingProfilePatch {
  displayName?: string | null;
  salaryRange?: SalaryRange | null;
  payday?: number | null;
  financialGoal?: string | null;
}

async function parseApiError(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  return body.error ?? fallback;
}

export async function saveOnboardingProfile(
  _userId: string,
  patch: OnboardingProfilePatch
): Promise<void> {
  const res = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      displayName: patch.displayName ?? null,
      salaryRange: patch.salaryRange ?? null,
      payday: patch.payday ?? null,
      financialGoal: patch.financialGoal ?? null,
    }),
  });
  if (!res.ok) {
    throw new Error(await parseApiError(res, "Erro ao salvar perfil"));
  }
}

export async function markOnboardingComplete(userId: string): Promise<void> {
  const now = new Date().toISOString();
  const res = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      onboardingCompleted: true,
      onboardingCompletedAt: now,
    }),
  });
  if (!res.ok) {
    throw new Error(await parseApiError(res, "Erro ao finalizar onboarding"));
  }
  try {
    localStorage.setItem(onboardingCompletedStorageKey(userId), "true");
    localStorage.removeItem(ONBOARDING_COMPLETED_KEY); // legado global
  } catch {
    /* noop */
  }
}

export async function resetOnboarding(userId: string): Promise<void> {
  const res = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      onboardingCompleted: false,
      onboardingCompletedAt: null,
    }),
  });
  if (!res.ok) {
    throw new Error(await parseApiError(res, "Erro ao resetar onboarding"));
  }
  try {
    localStorage.removeItem(onboardingCompletedStorageKey(userId));
    localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    localStorage.removeItem("nyx_onboarding_data");
    localStorage.removeItem("nyx_profile_identity");
  } catch {
    /* noop */
  }
}

export function syncLocalProfileIdentity(patch: {
  displayName: string;
  salaryRange: string;
  payday: number;
  financialGoal: string;
}) {
  try {
    const existing = localStorage.getItem("nyx_profile_identity");
    const identity = existing ? JSON.parse(existing) : {};
    localStorage.setItem(
      "nyx_profile_identity",
      JSON.stringify({
        ...identity,
        fullName: patch.displayName,
        salaryRange: patch.salaryRange,
        payday: patch.payday,
        financialGoal: patch.financialGoal || undefined,
      })
    );
  } catch {
    /* noop */
  }
}
