import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CHARACTER_IDS, SKIN_IDS } from "./ids";
import { buildStoreItems, canSelectPair } from "./catalog";
import { CATALOG_CHARACTERS, CATALOG_SKINS } from "./seedCatalog";
import { loadJourneyProgressSnapshot } from "@/lib/journey/progress";
import { resolveUnlockedIds } from "./unlockResolution";
import type {
  AssistantPreferenceDto,
  AssistantStateDto,
  CharacterDto,
  SkinAssetConfig,
  SkinDto,
} from "./types";

function asJson(
  value: Record<string, unknown> | undefined
): Prisma.InputJsonValue | undefined {
  if (!value) return undefined;
  return value as Prisma.InputJsonValue;
}

function mapCharacter(row: {
  id: string;
  slug: string;
  name: string;
  description: string;
  personalityKey: string;
  defaultUnlocked: boolean;
  active: boolean;
  displayOrder: number;
}): CharacterDto {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    personalityKey: row.personalityKey as CharacterDto["personalityKey"],
    defaultUnlocked: row.defaultUnlocked,
    active: row.active,
    displayOrder: row.displayOrder,
  };
}

function mapSkin(row: {
  id: string;
  characterId: string;
  slug: string;
  name: string;
  description: string;
  assetConfig: unknown;
  defaultUnlocked: boolean;
  isDefault: boolean;
  active: boolean;
  displayOrder: number;
  availabilityStatus: SkinDto["availabilityStatus"];
  unlockRuleKey: string | null;
}): SkinDto {
  return {
    id: row.id,
    characterId: row.characterId,
    slug: row.slug,
    name: row.name,
    description: row.description,
    assetConfig: (row.assetConfig ?? {}) as SkinAssetConfig,
    defaultUnlocked: row.defaultUnlocked,
    isDefault: row.isDefault,
    active: row.active,
    displayOrder: row.displayOrder,
    availabilityStatus: row.availabilityStatus,
    unlockRuleKey: row.unlockRuleKey,
  };
}

/** Garante catálogo seed no banco (idempotente). */
export async function ensureAssistantCatalog(): Promise<void> {
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
}

/**
 * Concede unlocks padrão (Nyx + Nyx Padrão) e cria preferência se ausente.
 * Não concede Eva/skins bloqueadas.
 */
export async function ensureUserAssistantDefaults(userId: string): Promise<void> {
  await ensureAssistantCatalog();

  // createMany + skipDuplicates é seguro contra corrida entre requests
  // simultâneos (bootstrap e GET /api/assistant), diferente do upsert.
  await prisma.userCharacterUnlock.createMany({
    data: [
      {
        userId,
        characterId: CHARACTER_IDS.nyx,
        unlockSource: "default",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.userSkinUnlock.createMany({
    data: [
      {
        userId,
        skinId: SKIN_IDS.nyxDefault,
        unlockSource: "default",
      },
    ],
    skipDuplicates: true,
  });

  const existing = await prisma.userAssistantPreference.findUnique({
    where: { userId },
  });
  if (!existing) {
    try {
      await prisma.userAssistantPreference.create({
        data: {
          userId,
          selectedCharacterId: CHARACTER_IDS.nyx,
          selectedSkinId: SKIN_IDS.nyxDefault,
        },
      });
    } catch (e) {
      // P2002: outra request criou a preferência ao mesmo tempo — ok
      if (
        !(e && typeof e === "object" && "code" in e && e.code === "P2002")
      ) {
        throw e;
      }
    }
  }
}

/**
 * Concessão server-side de personagem (libera skin padrão junto).
 * Não expor via endpoint cliente.
 */
export async function grantCharacterUnlock(
  userId: string,
  characterId: string,
  source: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await prisma.userCharacterUnlock.upsert({
    where: { userId_characterId: { userId, characterId } },
    create: {
      userId,
      characterId,
      unlockSource: source,
      metadata: asJson(metadata),
    },
    update: {},
  });

  const defaultSkin = await prisma.characterSkin.findFirst({
    where: { characterId, isDefault: true, active: true },
  });
  if (defaultSkin) {
    await prisma.userSkinUnlock.upsert({
      where: { userId_skinId: { userId, skinId: defaultSkin.id } },
      create: {
        userId,
        skinId: defaultSkin.id,
        unlockSource: source,
        metadata: asJson(metadata),
      },
      update: {},
    });
  }
}

/**
 * Concessão server-side de skin.
 * Se a personagem da skin ainda não estiver liberada, libera junto.
 */
export async function grantSkinUnlock(
  userId: string,
  skinId: string,
  source: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const skin = await prisma.characterSkin.findUnique({ where: { id: skinId } });
  if (!skin) throw new Error("Skin não encontrada");

  await grantCharacterUnlock(userId, skin.characterId, source, metadata);

  await prisma.userSkinUnlock.upsert({
    where: { userId_skinId: { userId, skinId } },
    create: {
      userId,
      skinId,
      unlockSource: source,
      metadata: asJson(metadata),
    },
    update: {},
  });
}

export async function getAssistantState(userId: string): Promise<AssistantStateDto> {
  await ensureUserAssistantDefaults(userId);

  const [characters, skins, characterUnlocks, skinUnlocks, preference] =
    await Promise.all([
      prisma.character.findMany({
        where: { active: true },
        orderBy: { displayOrder: "asc" },
      }),
      prisma.characterSkin.findMany({
        where: { active: true },
        orderBy: { displayOrder: "asc" },
      }),
      prisma.userCharacterUnlock.findMany({ where: { userId } }),
      prisma.userSkinUnlock.findMany({ where: { userId } }),
      prisma.userAssistantPreference.findUniqueOrThrow({ where: { userId } }),
    ]);

  const characterDtos = characters.map(mapCharacter);
  const skinDtos = skins.map(mapSkin);
  const { unlockedCharacterIds, unlockedSkinIds } = resolveUnlockedIds({
    characters: characterDtos,
    skins: skinDtos,
    characterUnlockIds: characterUnlocks.map((u) => u.characterId),
    skinUnlockIds: skinUnlocks.map((u) => u.skinId),
  });

  const preferenceDto: AssistantPreferenceDto = {
    userId: preference.userId,
    selectedCharacterId: preference.selectedCharacterId,
    selectedSkinId: preference.selectedSkinId,
    updatedAt: preference.updatedAt.toISOString(),
  };

  const progress = await loadJourneyProgressSnapshot(userId);
  const storeItems = buildStoreItems({
    characters: characterDtos,
    skins: skinDtos,
    unlockedCharacterIds,
    unlockedSkinIds,
    selectedCharacterId: preference.selectedCharacterId,
    selectedSkinId: preference.selectedSkinId,
    progress,
  });

  return {
    characters: characterDtos,
    skins: skinDtos,
    unlockedCharacterIds,
    unlockedSkinIds,
    preference: preferenceDto,
    storeItems,
  };
}

export async function selectAssistantPair(
  userId: string,
  characterId: string,
  skinId: string
): Promise<AssistantPreferenceDto> {
  await ensureUserAssistantDefaults(userId);

  return prisma.$transaction(async (tx) => {
    const [character, skin, characters, skins, characterUnlocks, skinUnlocks] =
      await Promise.all([
        tx.character.findUnique({ where: { id: characterId } }),
        tx.characterSkin.findUnique({ where: { id: skinId } }),
        tx.character.findMany({ select: { id: true, defaultUnlocked: true } }),
        tx.characterSkin.findMany({ select: { id: true, defaultUnlocked: true } }),
        tx.userCharacterUnlock.findMany({ where: { userId } }),
        tx.userSkinUnlock.findMany({ where: { userId } }),
      ]);

    if (!character || !skin) {
      throw new SelectAssistantError("Item não encontrado", 404);
    }

    const { unlockedCharacterIds, unlockedSkinIds } = resolveUnlockedIds({
      characters,
      skins,
      characterUnlockIds: characterUnlocks.map((u) => u.characterId),
      skinUnlockIds: skinUnlocks.map((u) => u.skinId),
    });

    const check = canSelectPair({
      character: mapCharacter(character),
      skin: mapSkin(skin),
      unlockedCharacterIds,
      unlockedSkinIds,
    });
    if (!check.ok) {
      throw new SelectAssistantError(check.reason, 403);
    }

    // Um único upsert: characterId + skinId juntos (atômico na mesma transação)
    const updated = await tx.userAssistantPreference.upsert({
      where: { userId },
      create: {
        userId,
        selectedCharacterId: characterId,
        selectedSkinId: skinId,
      },
      update: {
        selectedCharacterId: characterId,
        selectedSkinId: skinId,
      },
    });

    return {
      userId: updated.userId,
      selectedCharacterId: updated.selectedCharacterId,
      selectedSkinId: updated.selectedSkinId,
      updatedAt: updated.updatedAt.toISOString(),
    };
  });
}

export class SelectAssistantError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "SelectAssistantError";
    this.status = status;
  }
}
