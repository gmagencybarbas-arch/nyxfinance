import type { AudioKey, PersonalityKey } from "./ids";

export type SkinAvailabilityStatus =
  | "available"
  | "locked"
  | "coming_soon"
  | "unavailable";

export type StoreItemStatus =
  | "selected"
  | "unlocked"
  | "locked"
  | "in_use"
  | "coming_soon"
  | "loading"
  | "unavailable";

export type StoreItemType = "character" | "skin";

export type VisualAssetKey =
  | "master"
  | "typing"
  | "thinking"
  | "sucess"
  | "error"
  | "special01"
  | "special02"
  | "storePreview"
  | "storeThumbnail";

export type SkinAssetConfig = Partial<Record<VisualAssetKey, string>> & {
  /** Variações sorteadas ao entrar no estado thinking. */
  thinkingVariants?: string[];
  width?: number;
  height?: number;
  placeholder?: boolean;
};

export type UnlockRequirement = {
  ruleKey: string;
  title: string;
  description: string;
  current: number;
  target: number;
  summaryLines: string[];
  available: boolean;
};

export type CharacterDto = {
  id: string;
  slug: string;
  name: string;
  description: string;
  personalityKey: PersonalityKey;
  defaultUnlocked: boolean;
  active: boolean;
  displayOrder: number;
};

export type SkinDto = {
  id: string;
  characterId: string;
  slug: string;
  name: string;
  description: string;
  assetConfig: SkinAssetConfig;
  defaultUnlocked: boolean;
  isDefault: boolean;
  active: boolean;
  displayOrder: number;
  availabilityStatus: SkinAvailabilityStatus;
  unlockRuleKey: string | null;
};

export type StoreItem = {
  id: string;
  type: StoreItemType;
  characterId: string;
  skinId: string;
  slug: string;
  name: string;
  description: string;
  categoryLabel: string;
  preview: string;
  thumbnail: string;
  status: StoreItemStatus;
  unlockRequirement?: UnlockRequirement;
  personalityKey: PersonalityKey;
  audioKey: AudioKey;
};

export type AssistantPreferenceDto = {
  userId: string;
  selectedCharacterId: string;
  selectedSkinId: string;
  updatedAt: string;
};

export type AssistantStateDto = {
  characters: CharacterDto[];
  skins: SkinDto[];
  unlockedCharacterIds: string[];
  unlockedSkinIds: string[];
  preference: AssistantPreferenceDto;
  storeItems: StoreItem[];
};

export type CharacterRuntimeConfig = {
  id: string;
  slug: string;
  name: string;
  personalityKey: PersonalityKey;
  audioKey: AudioKey;
  defaultSkinSlug: string;
  promptTone: string;
};

export type SkinRuntimeConfig = {
  id: string;
  slug: string;
  characterSlug: string;
  name: string;
  assets: SkinAssetConfig;
};
