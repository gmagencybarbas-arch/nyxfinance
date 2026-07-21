/**
 * Tipos do profile alinhados ao schema Supabase `profiles`.
 * Tabela: profiles (id uuid PK references auth.users, ...)
 */

export type SalaryRange =
  | "ate_1k"
  | "1k_3k"
  | "3k_5k"
  | "5k_10k"
  | "10k_20k"
  | "20k_plus";

export type ThemePreference = "dark" | "light" | "system";

/** Linha da tabela `profiles` (snake_case do Supabase) */
export interface ProfileRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  profession: string | null;
  job_title: string | null;
  salary_range: SalaryRange | null;
  payday: number | null;
  financial_goal: string | null;
  theme_preference: ThemePreference | null;
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  updated_at: string;
}

/** Profile no app (camelCase, null-safe) */
export interface Profile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  profession: string | null;
  jobTitle: string | null;
  salaryRange: SalaryRange | null;
  payday: number | null;
  financialGoal: string | null;
  themePreference: ThemePreference | null;
  onboardingCompleted: boolean;
  onboardingCompletedAt: string | null;
  updatedAt: string;
}

/** Payload para update (partial, snake_case para Supabase) */
export type ProfileUpdateRow = Partial<{
  display_name: string | null;
  avatar_url: string | null;
  profession: string | null;
  job_title: string | null;
  salary_range: SalaryRange | null;
  payday: number | null;
  financial_goal: string | null;
  theme_preference: ThemePreference | null;
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
}>;

export function profileRowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name ?? null,
    avatarUrl: row.avatar_url ?? null,
    profession: row.profession ?? null,
    jobTitle: row.job_title ?? null,
    salaryRange: row.salary_range ?? null,
    payday: row.payday ?? null,
    financialGoal: row.financial_goal ?? null,
    themePreference: row.theme_preference ?? null,
    onboardingCompleted: row.onboarding_completed ?? false,
    onboardingCompletedAt: row.onboarding_completed_at ?? null,
    updatedAt: row.updated_at,
  };
}
