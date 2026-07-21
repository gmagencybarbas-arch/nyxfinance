import type { CharacterDto, SkinDto } from "./types";

/**
 * Regra única de desbloqueio usada por catálogo, API de estado e seleção.
 * - defaultUnlocked no catálogo conta como liberado (ex.: Nyx)
 * - registros em user_*_unlocks também liberam
 * Bootstrap ainda grava unlock explícito da Nyx para auditoria e consistência.
 */
export function resolveUnlockedIds(input: {
  characters: Pick<CharacterDto, "id" | "defaultUnlocked">[];
  skins: Pick<SkinDto, "id" | "defaultUnlocked">[];
  characterUnlockIds: string[];
  skinUnlockIds: string[];
}): { unlockedCharacterIds: string[]; unlockedSkinIds: string[] } {
  const unlockedCharacterIds = [
    ...new Set([
      ...input.characterUnlockIds,
      ...input.characters.filter((c) => c.defaultUnlocked).map((c) => c.id),
    ]),
  ];
  const unlockedSkinIds = [
    ...new Set([
      ...input.skinUnlockIds,
      ...input.skins.filter((s) => s.defaultUnlocked).map((s) => s.id),
    ]),
  ];
  return { unlockedCharacterIds, unlockedSkinIds };
}
