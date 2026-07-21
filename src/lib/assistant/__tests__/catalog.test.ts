import { describe, expect, it } from "vitest";
import { CHARACTER_IDS, SKIN_IDS } from "../ids";
import {
  buildStoreItems,
  canSelectPair,
  isCharacterUnlocked,
  isSkinUnlocked,
} from "../catalog";
import { CATALOG_CHARACTERS, CATALOG_SKINS } from "../seedCatalog";
import { getCharacterConfigById } from "../characterConfig";
import { getSkinConfigById } from "../skinConfig";
import { getJourneyProgressSnapshot } from "../unlockRules";
import type { CharacterDto, SkinDto } from "../types";

const characters = CATALOG_CHARACTERS.map(
  (c): CharacterDto => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    personalityKey: c.personalityKey,
    defaultUnlocked: c.defaultUnlocked,
    active: c.active,
    displayOrder: c.displayOrder,
  })
);

const skins = CATALOG_SKINS.map(
  (s): SkinDto => ({
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
  })
);

describe("assistant catalog", () => {
  it("Nyx está disponível por padrão", () => {
    const nyx = characters.find((c) => c.id === CHARACTER_IDS.nyx)!;
    expect(isCharacterUnlocked(nyx, new Set())).toBe(true);
  });

  it("Nyx padrão é selecionável", () => {
    const nyx = characters.find((c) => c.id === CHARACTER_IDS.nyx)!;
    const skin = skins.find((s) => s.id === SKIN_IDS.nyxDefault)!;
    const check = canSelectPair({
      character: nyx,
      skin,
      unlockedCharacterIds: [],
      unlockedSkinIds: [],
    });
    expect(check.ok).toBe(true);
  });

  it("Eva começa bloqueada e não pode ser selecionada", () => {
    const eva = characters.find((c) => c.id === CHARACTER_IDS.eva)!;
    const skin = skins.find((s) => s.id === SKIN_IDS.evaDefault)!;
    expect(isCharacterUnlocked(eva, new Set())).toBe(false);
    const check = canSelectPair({
      character: eva,
      skin,
      unlockedCharacterIds: [],
      unlockedSkinIds: [],
    });
    expect(check.ok).toBe(false);
  });

  it("Eva padrão é liberada junto com a Eva", () => {
    const eva = characters.find((c) => c.id === CHARACTER_IDS.eva)!;
    const skin = skins.find((s) => s.id === SKIN_IDS.evaDefault)!;
    const unlockedChars = [CHARACTER_IDS.eva];
    const unlockedSkins = [SKIN_IDS.evaDefault];
    expect(isCharacterUnlocked(eva, new Set(unlockedChars))).toBe(true);
    expect(isSkinUnlocked(skin, new Set(unlockedSkins), true)).toBe(true);
    const check = canSelectPair({
      character: eva,
      skin,
      unlockedCharacterIds: unlockedChars,
      unlockedSkinIds: unlockedSkins,
    });
    expect(check.ok).toBe(true);
  });

  it("Nyx Praia continua sendo skin da Nyx", () => {
    const beach = skins.find((s) => s.id === SKIN_IDS.nyxBeach)!;
    expect(beach.characterId).toBe(CHARACTER_IDS.nyx);
    const cfg = getSkinConfigById(beach.id)!;
    expect(cfg.characterSlug).toBe("nyx");
  });

  it("Boa noite Eva continua sendo skin da Eva", () => {
    const fitness = skins.find((s) => s.id === SKIN_IDS.evaFitness)!;
    expect(fitness.characterId).toBe(CHARACTER_IDS.eva);
    expect(fitness.name).toBe("Boa noite Eva");
    const cfg = getSkinConfigById(fitness.id)!;
    expect(cfg.characterSlug).toBe("eva");
  });

  it("skin não altera personalidade base", () => {
    const nyxPersonality = getCharacterConfigById(CHARACTER_IDS.nyx)!.personalityKey;
    const beach = getSkinConfigById(SKIN_IDS.nyxBeach)!;
    expect(beach.characterSlug).toBe("nyx");
    expect(nyxPersonality).toBe("nyx");
    // trocar skin não muda personalityKey da personagem
    expect(getCharacterConfigById(CHARACTER_IDS.nyx)!.personalityKey).toBe(
      nyxPersonality
    );
  });

  it("Boa noite Eva pode ser selecionada depois do unlock", () => {
    const eva = characters.find((c) => c.id === CHARACTER_IDS.eva)!;
    const fitness = skins.find((s) => s.id === SKIN_IDS.evaFitness)!;
    const check = canSelectPair({
      character: eva,
      skin: fitness,
      unlockedCharacterIds: [CHARACTER_IDS.eva],
      unlockedSkinIds: [SKIN_IDS.evaDefault, SKIN_IDS.evaFitness],
    });
    expect(check.ok).toBe(true);
  });

  it("catálogo unificado tem 4 itens na ordem visual", () => {
    const items = buildStoreItems({
      characters,
      skins,
      unlockedCharacterIds: [CHARACTER_IDS.nyx],
      unlockedSkinIds: [SKIN_IDS.nyxDefault],
      selectedCharacterId: CHARACTER_IDS.nyx,
      selectedSkinId: SKIN_IDS.nyxDefault,
      progress: getJourneyProgressSnapshot("user"),
    });
    expect(items.map((i) => i.slug)).toEqual([
      "nyx",
      "eva",
      "nyx-beach",
      "eva-fitness",
    ]);
    expect(items.find((i) => i.slug === "nyx")?.status).toBe("in_use");
    expect(items.find((i) => i.slug === "eva")?.status).toBe("locked");
    expect(items.find((i) => i.slug === "eva-fitness")?.status).toBe("locked");
  });

  it("progresso da Jornada começa vazio (sem dados inventados)", () => {
    const progress = getJourneyProgressSnapshot("any-user");
    expect(progress.completedMissionCount).toBe(0);
    expect(progress.completedCollection1).toBe(false);
  });

  it("skin de outra personagem é rejeitada", () => {
    const nyx = characters.find((c) => c.id === CHARACTER_IDS.nyx)!;
    const evaSkin = skins.find((s) => s.id === SKIN_IDS.evaDefault)!;
    const check = canSelectPair({
      character: nyx,
      skin: evaSkin,
      unlockedCharacterIds: [CHARACTER_IDS.nyx, CHARACTER_IDS.eva],
      unlockedSkinIds: [SKIN_IDS.nyxDefault, SKIN_IDS.evaDefault],
    });
    expect(check.ok).toBe(false);
  });
});
