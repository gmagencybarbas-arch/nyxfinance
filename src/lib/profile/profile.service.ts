import { prisma } from "@/lib/prisma";
import type { Profile, SalaryRange, ThemePreference } from "@/types/profile";
import { profileRowToProfile } from "@/types/profile";

export type ProfilePatch = Partial<{
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
}>;

function toPrismaData(patch: ProfilePatch) {
  return {
    ...(patch.displayName !== undefined && { displayName: patch.displayName }),
    ...(patch.avatarUrl !== undefined && { avatarUrl: patch.avatarUrl }),
    ...(patch.profession !== undefined && { profession: patch.profession }),
    ...(patch.jobTitle !== undefined && { jobTitle: patch.jobTitle }),
    ...(patch.salaryRange !== undefined && { salaryRange: patch.salaryRange }),
    ...(patch.payday !== undefined && { payday: patch.payday }),
    ...(patch.financialGoal !== undefined && { financialGoal: patch.financialGoal }),
    ...(patch.themePreference !== undefined && { themePreference: patch.themePreference }),
    ...(patch.onboardingCompleted !== undefined && {
      onboardingCompleted: patch.onboardingCompleted,
    }),
    ...(patch.onboardingCompletedAt !== undefined && {
      onboardingCompletedAt: patch.onboardingCompletedAt
        ? new Date(patch.onboardingCompletedAt)
        : null,
    }),
  };
}

function prismaToProfileRow(row: {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  profession: string | null;
  jobTitle: string | null;
  salaryRange: string | null;
  payday: number | null;
  financialGoal: string | null;
  themePreference: string | null;
  onboardingCompleted: boolean;
  onboardingCompletedAt: Date | null;
  updatedAt: Date;
}) {
  return profileRowToProfile({
    id: row.id,
    display_name: row.displayName,
    avatar_url: row.avatarUrl,
    profession: row.profession,
    job_title: row.jobTitle,
    salary_range: row.salaryRange as SalaryRange | null,
    payday: row.payday,
    financial_goal: row.financialGoal,
    theme_preference: row.themePreference as ThemePreference | null,
    onboarding_completed: row.onboardingCompleted,
    onboarding_completed_at: row.onboardingCompletedAt?.toISOString() ?? null,
    updated_at: row.updatedAt.toISOString(),
  });
}

export async function ensureProfile(userId: string): Promise<Profile> {
  const row = await prisma.profile.upsert({
    where: { id: userId },
    create: { id: userId },
    update: {},
  });
  return prismaToProfileRow(row);
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const row = await prisma.profile.findUnique({ where: { id: userId } });
  return row ? prismaToProfileRow(row) : null;
}

export async function updateProfile(userId: string, patch: ProfilePatch): Promise<Profile> {
  await ensureProfile(userId);
  const row = await prisma.profile.update({
    where: { id: userId },
    data: toPrismaData(patch),
  });
  return prismaToProfileRow(row);
}
