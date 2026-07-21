import { CHARACTER_IDS, type CharacterSlug } from "./ids";
import { getPersonalityConfig } from "./personalityConfig";
import type { CharacterRuntimeConfig } from "./types";

export const CHARACTER_CONFIG: Record<CharacterSlug, CharacterRuntimeConfig> = {
  nyx: {
    id: CHARACTER_IDS.nyx,
    slug: "nyx",
    name: "Nyx",
    personalityKey: "nyx",
    audioKey: "nyx",
    defaultSkinSlug: "nyx-default",
    promptTone: getPersonalityConfig("nyx").promptTone,
  },
  eva: {
    id: CHARACTER_IDS.eva,
    slug: "eva",
    name: "Eva",
    personalityKey: "eva",
    audioKey: "eva",
    defaultSkinSlug: "eva-default",
    promptTone: getPersonalityConfig("eva").promptTone,
  },
};

export function getCharacterConfigBySlug(slug: string): CharacterRuntimeConfig | null {
  if (slug === "nyx" || slug === "eva") return CHARACTER_CONFIG[slug];
  return null;
}

export function getCharacterConfigById(id: string): CharacterRuntimeConfig | null {
  return (
    Object.values(CHARACTER_CONFIG).find((c) => c.id === id) ?? null
  );
}

export function personalityKeyForCharacterId(id: string): PersonalityKey {
  return getCharacterConfigById(id)?.personalityKey ?? "nyx";
}

export function audioKeyForCharacterId(id: string): AudioKey {
  return getCharacterConfigById(id)?.audioKey ?? "nyx";
}
