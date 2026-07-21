/**
 * Seed inicial para desenvolvimento local.
 * Idempotente: não duplica Tenant, User nem transactions.
 */

import { PrismaClient } from "@prisma/client";
import type { TransactionType, TransactionStatus } from "@prisma/client";
import { CHARACTER_IDS, SKIN_IDS } from "../src/lib/assistant/ids";
import { CATALOG_CHARACTERS, CATALOG_SKINS } from "../src/lib/assistant/seedCatalog";

const prisma = new PrismaClient();

const SEED_TENANT_ID = "00000000-0000-4000-8000-000000000001";
const SEED_USER_ID = "00000000-0000-4000-8000-000000000002";

const CATEGORIES_INCOME: { category: string; descriptions: string[] }[] = [
  { category: "Salário", descriptions: ["Salário mensal", "Salário líquido", "Pagamento empresa"] },
  { category: "Freelance", descriptions: ["Projeto site", "Consultoria", "Desenvolvimento", "Design"] },
];

const CATEGORIES_EXPENSE: { category: string; descriptions: string[] }[] = [
  { category: "Alimentação", descriptions: ["Supermercado", "Restaurante", "iFood", "Padaria", "Feira"] },
  { category: "Transporte", descriptions: ["Uber", "Gasolina", "Ônibus", "Estacionamento", "Manutenção carro"] },
  { category: "Moradia", descriptions: ["Aluguel", "Condomínio", "Conta de luz", "Internet", "Água"] },
  { category: "Lazer", descriptions: ["Cinema", "Streaming", "Academia", "Livros", "Viagem"] },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)]!;
}

function addDays(date: Date, days: number): Date {
  const out = new Date(date);
  out.setDate(out.getDate() + days);
  return out;
}

function randomDateBetween(start: Date, end: Date): Date {
  const ts = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(ts);
}

/** Valores realistas em BRL por tipo/categoria */
function randomAmount(type: TransactionType, category: string): number {
  if (type === "INCOME") {
    if (category === "Salário") return randomInt(3500, 8500) + randomInt(0, 99) / 100;
    if (category === "Freelance") return randomInt(400, 3500) + randomInt(0, 99) / 100;
  }
  // EXPENSE
  switch (category) {
    case "Alimentação":
      return randomInt(25, 450) + randomInt(0, 99) / 100;
    case "Transporte":
      return randomInt(15, 180) + randomInt(0, 99) / 100;
    case "Moradia":
      return randomInt(80, 2500) + randomInt(0, 99) / 100;
    case "Lazer":
      return randomInt(30, 350) + randomInt(0, 99) / 100;
    default:
      return randomInt(50, 500) + randomInt(0, 99) / 100;
  }
}

async function seedAssistantCatalog(): Promise<void> {
  const now = new Date();
  for (const c of CATALOG_CHARACTERS) {
    await prisma.character.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        personalityKey: c.personalityKey,
        defaultUnlocked: c.defaultUnlocked,
        active: c.active,
        displayOrder: c.displayOrder,
        updatedAt: now,
      },
      update: {
        name: c.name,
        description: c.description,
        personalityKey: c.personalityKey,
        defaultUnlocked: c.defaultUnlocked,
        active: c.active,
        displayOrder: c.displayOrder,
        updatedAt: now,
      },
    });
  }
  for (const s of CATALOG_SKINS) {
    await prisma.characterSkin.upsert({
      where: { id: s.id },
      create: {
        id: s.id,
        characterId: s.characterId,
        slug: s.slug,
        name: s.name,
        description: s.description,
        assetConfig: s.assetConfig,
        defaultUnlocked: s.defaultUnlocked,
        isDefault: s.isDefault,
        active: s.active,
        displayOrder: s.displayOrder,
        availabilityStatus: s.availabilityStatus,
        unlockRuleKey: s.unlockRuleKey,
        updatedAt: now,
      },
      update: {
        name: s.name,
        description: s.description,
        assetConfig: s.assetConfig,
        defaultUnlocked: s.defaultUnlocked,
        isDefault: s.isDefault,
        active: s.active,
        displayOrder: s.displayOrder,
        availabilityStatus: s.availabilityStatus,
        unlockRuleKey: s.unlockRuleKey,
        updatedAt: now,
      },
    });
  }
  console.log("✅ Catálogo assistente: Nyx, Eva, skins");
}

async function main(): Promise<void> {
  console.log("🌱 Seed iniciado...");

  await seedAssistantCatalog();

  const tenant = await prisma.tenant.upsert({
    where: { id: SEED_TENANT_ID },
    create: {
      id: SEED_TENANT_ID,
      name: "Tenant Desenvolvimento",
    },
    update: {},
  });
  console.log("✅ Tenant:", tenant.id, tenant.name ?? "(sem nome)");

  const user = await prisma.user.upsert({
    where: { id: SEED_USER_ID },
    create: {
      id: SEED_USER_ID,
      tenantId: SEED_TENANT_ID,
    },
    update: {},
  });
  console.log("✅ User:", user.id);

  await prisma.userCharacterUnlock.upsert({
    where: {
      userId_characterId: { userId: SEED_USER_ID, characterId: CHARACTER_IDS.nyx },
    },
    create: {
      userId: SEED_USER_ID,
      characterId: CHARACTER_IDS.nyx,
      unlockSource: "default",
    },
    update: {},
  });
  await prisma.userSkinUnlock.upsert({
    where: {
      userId_skinId: { userId: SEED_USER_ID, skinId: SKIN_IDS.nyxDefault },
    },
    create: {
      userId: SEED_USER_ID,
      skinId: SKIN_IDS.nyxDefault,
      unlockSource: "default",
    },
    update: {},
  });
  await prisma.userAssistantPreference.upsert({
    where: { userId: SEED_USER_ID },
    create: {
      userId: SEED_USER_ID,
      selectedCharacterId: CHARACTER_IDS.nyx,
      selectedSkinId: SKIN_IDS.nyxDefault,
    },
    update: {},
  });
  console.log("✅ Preferência assistente do user de seed: Nyx");

  const existingCount = await prisma.transaction.count({
    where: { userId: SEED_USER_ID },
  });
  if (existingCount > 0) {
    console.log("⏭️  Já existem", existingCount, "transações para o user de seed. Nada a inserir.");
    return;
  }

  const totalToCreate = randomInt(25, 40);
  const endDate = new Date();
  const startDate = addDays(endDate, -90);
  const transactions: {
    userId: string;
    tenantId: string;
    type: TransactionType;
    amount: number;
    currency: string;
    category: string;
    description: string | null;
    status: TransactionStatus;
    occurredAt: Date;
  }[] = [];

  for (let i = 0; i < totalToCreate; i++) {
    const isIncome = Math.random() < 0.25;
    const type: TransactionType = isIncome ? "INCOME" : "EXPENSE";
    const status: TransactionStatus = Math.random() < 0.85 ? "COMPLETED" : "PENDING";

    const catSet = type === "INCOME" ? CATEGORIES_INCOME : CATEGORIES_EXPENSE;
    const { category, descriptions } = randomChoice(catSet);
    const amount = randomAmount(type, category);
    const description = randomChoice(descriptions);
    const occurredAt = randomDateBetween(startDate, endDate);

    transactions.push({
      userId: SEED_USER_ID,
      tenantId: SEED_TENANT_ID,
      type,
      amount: Math.round(amount * 100) / 100,
      currency: "BRL",
      category,
      description,
      status,
      occurredAt,
    });
  }

  transactions.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

  await prisma.transaction.createMany({
    data: transactions.map((t) => ({
      userId: t.userId,
      tenantId: t.tenantId,
      type: t.type,
      amount: t.amount,
      currency: t.currency,
      category: t.category,
      description: t.description,
      status: t.status,
      occurredAt: t.occurredAt,
    })),
  });

  console.log("✅ Inseridas", transactions.length, "transações (últimos 90 dias).");
  const summary: Record<TransactionType | TransactionStatus, number> = {
    INCOME: 0,
    EXPENSE: 0,
    TRANSFER: 0,
    PENDING: 0,
    COMPLETED: 0,
    CANCELED: 0,
  };
  for (const t of transactions) {
    summary[t.type]++;
    summary[t.status]++;
  }
  console.log("   INCOME:", summary.INCOME, "| EXPENSE:", summary.EXPENSE);
  console.log("   COMPLETED:", summary.COMPLETED, "| PENDING:", summary.PENDING);
  console.log("🌱 Seed concluído.");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
