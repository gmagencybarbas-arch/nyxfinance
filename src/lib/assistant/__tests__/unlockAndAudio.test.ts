import { describe, expect, it } from "vitest";
import { CHARACTER_IDS, SKIN_IDS } from "../ids";
import { resolveUnlockedIds } from "../unlockResolution";
import { getCharacterSoundMap, getThinkingKeys, getThinkingVoiceDefs } from "../soundMaps";
import { EVA_SOUND_MAP } from "../evaSoundMap";
import { NYX_SOUND_MAP } from "@/lib/nyx/audio/nyxSoundMap";
import { getPersonalityConfig } from "../personalityConfig";
import { canSelectPair } from "../catalog";
import { CATALOG_CHARACTERS, CATALOG_SKINS } from "../seedCatalog";

describe("unlockResolution", () => {
  it("Nyx defaultUnlocked conta sem registro em unlocks", () => {
    const { unlockedCharacterIds, unlockedSkinIds } = resolveUnlockedIds({
      characters: [
        { id: CHARACTER_IDS.nyx, defaultUnlocked: true },
        { id: CHARACTER_IDS.eva, defaultUnlocked: false },
      ],
      skins: [
        { id: SKIN_IDS.nyxDefault, defaultUnlocked: true },
        { id: SKIN_IDS.evaDefault, defaultUnlocked: false },
      ],
      characterUnlockIds: [],
      skinUnlockIds: [],
    });
    expect(unlockedCharacterIds).toContain(CHARACTER_IDS.nyx);
    expect(unlockedCharacterIds).not.toContain(CHARACTER_IDS.eva);
    expect(unlockedSkinIds).toContain(SKIN_IDS.nyxDefault);
    expect(unlockedSkinIds).not.toContain(SKIN_IDS.evaDefault);
  });

  it("registros em unlocks liberam Eva", () => {
    const { unlockedCharacterIds } = resolveUnlockedIds({
      characters: [
        { id: CHARACTER_IDS.nyx, defaultUnlocked: true },
        { id: CHARACTER_IDS.eva, defaultUnlocked: false },
      ],
      skins: [],
      characterUnlockIds: [CHARACTER_IDS.eva],
      skinUnlockIds: [],
    });
    expect(unlockedCharacterIds).toEqual(
      expect.arrayContaining([CHARACTER_IDS.nyx, CHARACTER_IDS.eva])
    );
  });
});

describe("sound maps", () => {
  it("Eva usa mapa independente (não reutiliza paths da Nyx)", () => {
    const eva = getCharacterSoundMap("eva");
    const nyx = getCharacterSoundMap("nyx");
    expect(eva).toBe(EVA_SOUND_MAP);
    expect(nyx).toBe(NYX_SOUND_MAP);
    expect(eva.thinkingShort.src).toContain("/eva/sounds/eva_thinking");
    expect(eva.thinkingShort.src).not.toContain("thinking_audio");
    expect(nyx.thinkingShort.src).toContain("thinking-pulse");
    expect(nyx.thinkingShort.src).not.toContain("thinking_audio");
    expect(eva.thinkingShort.src).not.toBe(nyx.thinkingShort.src);
    expect(eva.successA.fileName).toMatch(/^eva_/);
  });

  it("Nyx e Eva têm 5 thinking padrão; voice separado", () => {
    expect(getThinkingKeys("nyx")).toHaveLength(5);
    expect(getThinkingKeys("eva")).toHaveLength(5);
    expect(getThinkingVoiceDefs("nyx")).toHaveLength(8);
    expect(getThinkingVoiceDefs("eva")).toHaveLength(6);
    expect(getThinkingVoiceDefs("nyx")[0]!.fileName).toMatch(/nyx_thinking_audio/);
    expect(getThinkingVoiceDefs("eva")[0]!.fileName).toMatch(/eva_thinking_audio/);
  });
});

describe("personality", () => {
  it("Eva tem personalidade própria", () => {
    const eva = getPersonalityConfig("eva");
    expect(eva.displayName).toBe("Eva");
    expect(eva.traits).toEqual(
      expect.arrayContaining([
        "simpática",
        "carinhosa",
        "adulta",
        "inteligente",
        "acolhedora",
        "levemente fofa",
        "espontânea",
      ])
    );
  });
});

describe("coming_soon selection", () => {
  it("bloqueia skin coming_soon mesmo com unlock", () => {
    const eva = {
      ...CATALOG_CHARACTERS.find((c) => c.id === CHARACTER_IDS.eva)!,
      personalityKey: "eva" as const,
    };
    const skin = {
      ...CATALOG_SKINS.find((s) => s.id === SKIN_IDS.evaFitness)!,
      availabilityStatus: "coming_soon" as const,
      assetConfig: {},
    };
    const check = canSelectPair({
      character: eva,
      skin,
      unlockedCharacterIds: [CHARACTER_IDS.eva],
      unlockedSkinIds: [SKIN_IDS.evaFitness],
    });
    expect(check.ok).toBe(false);
  });
});
