/**
 * Mapa de microsons da Nyx (ElevenLabs).
 *
 * Arquivos em: public/nyx/sounds/
 *
 * | Arquivo              | Uso                              | rate | volume final | ~duração original | ~efetiva @ rate |
 * |----------------------|----------------------------------|------|--------------|-------------------|-----------------|
 * | thinking-pulse1.mp3  | thinking curto (70%)              | 1.4  | 0.32         | ~3s               | ~2.1s           |
 * | thinking-pulse.mp3   | thinking longo (30%)             | 1.4  | 0.30         | ~11s              | ~7.9s           |
 * | success-chime.mp3    | sucesso (variação A)             | 1.4  | 0.38         | ~11s              | ~7.9s           |
 * | success-chime1.mp3   | sucesso (variação B)             | 1.4  | 0.38         | ~11s              | ~7.9s           |
 * | cigarro.mp3          | idle cigarro (entrada cigarro01) | 1.2  | 0.24         | variável          | /1.2            |
 *
 * Opcionais (fallback silencioso se ausentes):
 * typing-soft.mp3, response-pop.mp3, error-glitch.mp3
 */

/** Master = 1 → volumes do mapa são o volume FINAL efetivo. */
export const NYX_SOUND_VOLUME = 1;

export type NyxSoundKey =
  | "thinkingShort"
  | "thinkingLong"
  | "thinkingC"
  | "thinkingD"
  | "thinkingE"
  | "successA"
  | "successB"
  | "successC"
  | "successD"
  | "cigarro"
  | "cigarroB"
  | "cigarroC"
  | "typing"
  | "response"
  | "error";

export type NyxSoundDef = {
  src: string;
  /** Volume FINAL efetivo (0–1). */
  volume: number;
  playbackRate: number;
  loop?: boolean;
  fileName: string;
};

export const NYX_SOUND_MAP: Record<NyxSoundKey, NyxSoundDef> = {
  thinkingShort: {
    src: "/nyx/sounds/thinking-pulse1.mp3",
    fileName: "thinking-pulse1.mp3",
    volume: 0.32,
    playbackRate: 1.4,
  },
  thinkingLong: {
    src: "/nyx/sounds/thinking-pulse.mp3",
    fileName: "thinking-pulse.mp3",
    volume: 0.3,
    playbackRate: 1.4,
  },
  thinkingC: {
    src: "/nyx/sounds/thinking-pulse2.mp3",
    fileName: "thinking-pulse2.mp3",
    volume: 0.32,
    playbackRate: 1.4,
  },
  thinkingD: {
    src: "/nyx/sounds/thinking-pulse3.mp3",
    fileName: "thinking-pulse3.mp3",
    volume: 0.32,
    playbackRate: 1.4,
  },
  thinkingE: {
    src: "/nyx/sounds/thinking-pulse4.mp3",
    fileName: "thinking-pulse4.mp3",
    volume: 0.32,
    playbackRate: 1.4,
  },
  successA: {
    src: "/nyx/sounds/success-chime.mp3",
    fileName: "success-chime.mp3",
    volume: 0.38,
    playbackRate: 1.4,
  },
  successB: {
    src: "/nyx/sounds/success-chime1.mp3",
    fileName: "success-chime1.mp3",
    volume: 0.38,
    playbackRate: 1.4,
  },
  successC: {
    src: "/nyx/sounds/success-chime2.mp3",
    fileName: "success-chime2.mp3",
    volume: 0.38,
    playbackRate: 1.4,
  },
  successD: {
    src: "/nyx/sounds/success-chime4.mp3",
    fileName: "success-chime4.mp3",
    volume: 0.38,
    playbackRate: 1.4,
  },
  cigarro: {
    src: "/nyx/sounds/cigarro.mp3",
    fileName: "cigarro.mp3",
    volume: 0.24,
    playbackRate: 1.2,
  },
  cigarroB: {
    src: "/nyx/sounds/cigarro01.mp3",
    fileName: "cigarro01.mp3",
    volume: 0.24,
    playbackRate: 1.2,
  },
  cigarroC: {
    src: "/nyx/sounds/cigarro02.mp3",
    fileName: "cigarro02.mp3",
    volume: 0.24,
    playbackRate: 1.2,
  },
  typing: {
    src: "/nyx/sounds/typing-soft.mp3",
    fileName: "typing-soft.mp3",
    volume: 0.08,
    playbackRate: 1,
  },
  response: {
    src: "/nyx/sounds/response-pop.mp3",
    fileName: "response-pop.mp3",
    volume: 0.12,
    playbackRate: 1,
  },
  error: {
    src: "/nyx/sounds/error-glitch.mp3",
    fileName: "error-glitch.mp3",
    volume: 0.1,
    playbackRate: 1,
  },
};

export const NYX_SOUND_STORAGE_KEY = "nyx_sound_enabled";

/** Throttle do typing-soft (ms). */
export const NYX_TYPING_SOUND_THROTTLE_MS = 800;

/** Ordem de preload após unlock. */
export const NYX_SOUND_PRELOAD_ORDER: NyxSoundKey[] = [
  "thinkingShort",
  "thinkingLong",
  "thinkingC",
  "thinkingD",
  "thinkingE",
  "successA",
  "successB",
  "successC",
  "successD",
  "cigarro",
  "cigarroB",
  "cigarroC",
];

/** Canais principais (não sobrepor). Só arquivos reais. */
export const NYX_MAIN_SOUND_KEYS: NyxSoundKey[] = [
  "thinkingShort",
  "thinkingLong",
  "thinkingC",
  "thinkingD",
  "thinkingE",
  "successA",
  "successB",
  "successC",
  "successD",
  "cigarro",
  "cigarroB",
  "cigarroC",
];
