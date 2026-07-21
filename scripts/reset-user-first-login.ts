/**
 * Reseta dados de app de um usuário (mantém login/senha no Supabase Auth).
 * Uso: npx tsx scripts/reset-user-first-login.ts lulislima03@gmail.com
 */

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const emailArg = process.argv[2]?.trim().toLowerCase();
if (!emailArg) {
  console.error("Uso: npx tsx scripts/reset-user-first-login.ts <email>");
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!DATABASE_URL) {
  console.error("DATABASE_URL ausente");
  process.exit(1);
}
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes");
  process.exit(1);
}

const prisma = new PrismaClient();
const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserIdByEmail(email: string): Promise<string | null> {
  // listUsers paginado
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    const hit = users.find((u) => u.email?.toLowerCase() === email);
    if (hit?.id) return hit.id;
    if (users.length < perPage) break;
    page += 1;
    if (page > 50) break;
  }
  return null;
}

async function main() {
  console.log(`Buscando usuário: ${emailArg}`);
  const userId = await findUserIdByEmail(emailArg);
  if (!userId) {
    console.error("Usuário não encontrado no Auth (email/senha intactos — conta inexistente).");
    process.exit(1);
  }
  console.log(`Auth OK (id=${userId}) — senha NÃO será alterada.`);

  const [tx, plans, bills] = await Promise.all([
    prisma.transaction.deleteMany({ where: { userId } }),
    prisma.installmentPlan.deleteMany({ where: { userId } }),
    prisma.recurringBill.deleteMany({ where: { userId } }),
  ]);

  const profile = await prisma.profile.upsert({
    where: { id: userId },
    create: {
      id: userId,
      onboardingCompleted: false,
      onboardingCompletedAt: null,
    },
    update: {
      onboardingCompleted: false,
      onboardingCompletedAt: null,
      displayName: null,
      avatarUrl: null,
      profession: null,
      jobTitle: null,
      salaryRange: null,
      payday: null,
      financialGoal: null,
    },
  });

  console.log("Wipe financeiro:");
  console.log(`  transactions: ${tx.count}`);
  console.log(`  installment_plans: ${plans.count}`);
  console.log(`  recurring_bills: ${bills.count}`);
  console.log(
    `Profile reset: onboardingCompleted=${profile.onboardingCompleted} (first login)`
  );
  console.log("");
  console.log(
    "Peça à usuária limpar o localStorage do site (ou abrir aba anônima) para não herdar flag antiga de onboarding."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
