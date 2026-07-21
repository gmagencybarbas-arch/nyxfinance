import { audioKeyForCharacterId, personalityKeyForCharacterId } from "./characterConfig";
import { getSkinConfigById } from "./skinConfig";
import type {
  CharacterDto,
  SkinDto,
  StoreItem,
  StoreItemStatus,
  UnlockRequirement,
} from "./types";
import { resolveUnlockRequirement, type JourneyProgressSnapshot } from "./unlockRules";

function categoryLabel(type: "character" | "skin", characterName: string): string {
  if (type === "character") return "PERSONAGEM";
  return `VISUAL DA ${characterName.toUpperCase()}`;
}

function previewForSkin(skin: SkinDto): { preview: string; thumbnail: string } {
  const runtime = getSkinConfigById(skin.id);
  const cfg = skin.assetConfig ?? runtime?.assets ?? {};
  return {
    preview: cfg.storePreview || cfg.master || "/store/placeholders/silhouette.svg",
    thumbnail: cfg.storeThumbnail || cfg.master || "/store/placeholders/silhouette.svg",
  };
}

export function isCharacterUnlocked(
  character: CharacterDto,
  unlockedCharacterIds: Set<string>
): boolean {
  return character.defaultUnlocked || unlockedCharacterIds.has(character.id);
}

export function isSkinUnlocked(
  skin: SkinDto,
  unlockedSkinIds: Set<string>,
  characterUnlocked: boolean
): boolean {
  if (skin.availabilityStatus === "coming_soon") return false;
  if (skin.availabilityStatus === "unavailable") return false;
  if (!characterUnlocked) return false;
  return skin.defaultUnlocked || unlockedSkinIds.has(skin.id);
}

export function resolveStoreItemStatus(input: {
  focused: boolean;
  inUse: boolean;
  unlocked: boolean;
  availabilityStatus: SkinDto["availabilityStatus"];
}): StoreItemStatus {
  if (input.availabilityStatus === "coming_soon") return "coming_soon";
  if (input.availabilityStatus === "unavailable") return "unavailable";
  if (input.inUse) return "in_use";
  if (!input.unlocked) return "locked";
  if (input.focused) return "selected";
  return "unlocked";
}

export function buildStoreItems(input: {
  characters: CharacterDto[];
  skins: SkinDto[];
  unlockedCharacterIds: string[];
  unlockedSkinIds: string[];
  selectedCharacterId: string;
  selectedSkinId: string;
  focusedItemId?: string | null;
  progress: JourneyProgressSnapshot;
}): StoreItem[] {
  const unlockedChars = new Set(input.unlockedCharacterIds);
  const unlockedSkins = new Set(input.unlockedSkinIds);
  const byCharacter = new Map(input.characters.map((c) => [c.id, c]));

  const items: StoreItem[] = [];

  // Personagens (skin padrão como preview)
  for (const character of [...input.characters].sort(
    (a, b) => a.displayOrder - b.displayOrder
  )) {
    const defaultSkin =
      input.skins.find((s) => s.characterId === character.id && s.isDefault) ??
      input.skins.find((s) => s.characterId === character.id);
    if (!defaultSkin) continue;

    const charUnlocked = isCharacterUnlocked(character, unlockedChars);
    const { preview, thumbnail } = previewForSkin(defaultSkin);
    const inUse =
      input.selectedCharacterId === character.id &&
      input.selectedSkinId === defaultSkin.id;
    const itemId = `character:${character.id}`;
    const focused = input.focusedItemId === itemId;
    const unlockRequirement = charUnlocked
      ? undefined
      : resolveUnlockRequirement(
          defaultSkin.unlockRuleKey ??
            (character.slug === "eva" ? "journey_missions_3" : null),
          input.progress
        );

    items.push({
      id: itemId,
      type: "character",
      characterId: character.id,
      skinId: defaultSkin.id,
      slug: character.slug,
      name: character.name,
      description: character.description,
      categoryLabel: categoryLabel("character", character.name),
      preview,
      thumbnail,
      status: resolveStoreItemStatus({
        focused,
        inUse,
        unlocked: charUnlocked,
        availabilityStatus: charUnlocked ? "available" : "locked",
      }),
      unlockRequirement,
      personalityKey: personalityKeyForCharacterId(character.id),
      audioKey: audioKeyForCharacterId(character.id),
    });
  }

  // Skins extras (não-default) — Nyx Praia, Eva Fitness
  for (const skin of [...input.skins]
    .filter((s) => !s.isDefault)
    .sort((a, b) => a.displayOrder - b.displayOrder)) {
    const character = byCharacter.get(skin.characterId);
    if (!character) continue;
    const charUnlocked = isCharacterUnlocked(character, unlockedChars);
    const skinUnlocked = isSkinUnlocked(skin, unlockedSkins, charUnlocked);
    const { preview, thumbnail } = previewForSkin(skin);
    const inUse = input.selectedSkinId === skin.id;
    const itemId = `skin:${skin.id}`;
    const focused = input.focusedItemId === itemId;

    let unlockRequirement: UnlockRequirement | undefined;
    if (skin.availabilityStatus === "coming_soon" || !skinUnlocked) {
      unlockRequirement = resolveUnlockRequirement(
        skin.unlockRuleKey,
        input.progress
      );
      if (!charUnlocked && character.slug === "eva") {
        unlockRequirement = resolveUnlockRequirement(
          "journey_missions_3",
          input.progress
        );
      }
    }

    items.push({
      id: itemId,
      type: "skin",
      characterId: character.id,
      skinId: skin.id,
      slug: skin.slug,
      name: skin.name,
      description: skin.description,
      categoryLabel: categoryLabel("skin", character.name),
      preview,
      thumbnail,
      status: resolveStoreItemStatus({
        focused,
        inUse,
        unlocked: skinUnlocked,
        availabilityStatus: skin.availabilityStatus,
      }),
      unlockRequirement,
      personalityKey: personalityKeyForCharacterId(character.id),
      audioKey: audioKeyForCharacterId(character.id),
    });
  }

  return items.sort((a, b) => {
    const galleryRank = (item: StoreItem) => {
      if (item.slug === "nyx") return 1;
      if (item.slug === "eva") return 2;
      if (item.slug === "nyx-beach") return 3;
      if (item.slug === "eva-fitness") return 4;
      const order =
        item.type === "character"
          ? (byCharacter.get(item.characterId)?.displayOrder ?? 0)
          : (input.skins.find((s) => s.id === item.skinId)?.displayOrder ?? 99);
      return 50 + order;
    };
    return galleryRank(a) - galleryRank(b);
  });
}

/** Valida se uma seleção é permitida (regras de domínio, sem I/O). */
export function canSelectPair(input: {
  character: CharacterDto;
  skin: SkinDto;
  unlockedCharacterIds: string[];
  unlockedSkinIds: string[];
}): { ok: true } | { ok: false; reason: string } {
  if (!input.character.active || !input.skin.active) {
    return { ok: false, reason: "Item indisponível" };
  }
  if (input.skin.characterId !== input.character.id) {
    return { ok: false, reason: "Esta skin não pertence à personagem" };
  }
  if (input.skin.availabilityStatus === "coming_soon") {
    return { ok: false, reason: "Este visual ainda está em breve" };
  }
  if (input.skin.availabilityStatus === "unavailable") {
    return { ok: false, reason: "Item indisponível" };
  }
  const unlockedChars = new Set(input.unlockedCharacterIds);
  const unlockedSkins = new Set(input.unlockedSkinIds);
  if (!isCharacterUnlocked(input.character, unlockedChars)) {
    return { ok: false, reason: "Personagem bloqueada" };
  }
  if (!isSkinUnlocked(input.skin, unlockedSkins, true)) {
    return { ok: false, reason: "Visual bloqueado" };
  }
  return { ok: true };
}
