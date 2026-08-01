import { CHARACTER_IDS, SKIN_IDS, type SkinSlug } from "./ids";
import type { SkinAssetConfig, SkinRuntimeConfig } from "./types";

/** Placeholder visual genérico (silhueta). Não usa sprite de outra skin. */
const PLACEHOLDER = "/store/placeholders/silhouette.svg";

function skinAssets(folder: string, opts?: { placeholder?: boolean }): SkinAssetConfig {
  const base = `/store/skins/${folder}`;
  const usePlaceholder = opts?.placeholder !== false;
  const src = (file: string) => (usePlaceholder ? PLACEHOLDER : `${base}/${file}`);
  return {
    master: src("master.png"),
    typing: src("typing.png"),
    thinking: src("thinking.png"),
    sucess: src("sucess.png"),
    error: src("error.png"),
    special01: src("special01.png"),
    special02: src("special02.png"),
    storePreview: src("preview.png"),
    storeThumbnail: src("thumb.png"),
    width: 996,
    height: 990,
    placeholder: usePlaceholder,
  };
}

/**
 * Nyx padrão pode apontar para sprites reais em /nyx quando existirem.
 * Enquanto placeholders=true, usa silhueta para não quebrar a Loja.
 * Chat continua com NYX_ASSETS legado se a skin ativa for nyx-default e os PNGs existirem.
 */
export const SKIN_CONFIG: Record<SkinSlug, SkinRuntimeConfig> = {
  "nyx-default": {
    id: SKIN_IDS.nyxDefault,
    slug: "nyx-default",
    characterSlug: "nyx",
    name: "Nyx",
    assets: {
      ...skinAssets("nyx-default", { placeholder: false }),
      master: "/nyx/master.png",
      typing: "/nyx/typing.png",
      thinking: "/nyx/thinking.png",
      thinkingVariants: [
        "/nyx/thinking.png",
        "/nyx/thinking1.png",
        "/nyx/thinking2.png",
      ],
      sucess: "/nyx/sucess.png",
      error: "/nyx/error.png",
      special01: "/nyx/cigarro01.png",
      special02: "/nyx/cigarro02.png",
      storePreview: "/nyx/master.png",
      storeThumbnail: "/nyx/master.png",
      placeholder: false,
    },
  },
  "eva-default": {
    id: SKIN_IDS.evaDefault,
    slug: "eva-default",
    characterSlug: "eva",
    name: "Eva",
    assets: {
      ...skinAssets("eva-default", { placeholder: false }),
      thinkingVariants: [
        "/store/skins/eva-default/thinking.png",
        "/store/skins/eva-default/thinking01.png",
      ],
      storePreview: "/store/skins/eva-default/master.png",
      storeThumbnail: "/store/skins/eva-default/master.png",
      placeholder: false,
    },
  },
  "nyx-beach": {
    id: SKIN_IDS.nyxBeach,
    slug: "nyx-beach",
    characterSlug: "nyx",
    name: "Nyx Praia",
    assets: skinAssets("nyx-beach"),
  },
  "eva-fitness": {
    id: SKIN_IDS.evaFitness,
    slug: "eva-fitness",
    characterSlug: "eva",
    name: "Boa noite Eva",
    assets: {
      ...skinAssets("eva-good-night", { placeholder: false }),
      storePreview: "/store/skins/eva-good-night/master.png",
      storeThumbnail: "/store/skins/eva-good-night/master.png",
      placeholder: false,
    },
  },
};

export function getSkinConfigBySlug(slug: string): SkinRuntimeConfig | null {
  if (
    slug === "nyx-default" ||
    slug === "eva-default" ||
    slug === "nyx-beach" ||
    slug === "eva-fitness"
  ) {
    return SKIN_CONFIG[slug];
  }
  return null;
}

export function getSkinConfigById(id: string): SkinRuntimeConfig | null {
  return Object.values(SKIN_CONFIG).find((s) => s.id === id) ?? null;
}

export function characterIdForSkinSlug(slug: SkinSlug): string {
  const skin = SKIN_CONFIG[slug];
  return skin.characterSlug === "eva" ? CHARACTER_IDS.eva : CHARACTER_IDS.nyx;
}
