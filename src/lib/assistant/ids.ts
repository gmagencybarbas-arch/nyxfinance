/** UUIDs estáveis do catálogo (seed + runtime). */

export const CHARACTER_IDS = {
  nyx: "10000000-0000-4000-8000-000000000001",
  eva: "10000000-0000-4000-8000-000000000002",
} as const;

export const SKIN_IDS = {
  nyxDefault: "20000000-0000-4000-8000-000000000001",
  evaDefault: "20000000-0000-4000-8000-000000000002",
  nyxBeach: "20000000-0000-4000-8000-000000000003",
  evaFitness: "20000000-0000-4000-8000-000000000004",
} as const;

export type CharacterSlug = "nyx" | "eva";
export type SkinSlug = "nyx-default" | "eva-default" | "nyx-beach" | "eva-fitness";
export type PersonalityKey = "nyx" | "eva";
export type AudioKey = "nyx" | "eva";
