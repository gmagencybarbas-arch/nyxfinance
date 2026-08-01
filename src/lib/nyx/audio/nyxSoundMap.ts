/**
 * Mapa de microsons da Nyx (ElevenLabs).
 *
 * Thinking: nyx_thinking_audio0..7 em public/nyx/sounds/
 * Playback rate >1 acelera a fala (pedido: um pouco mais rápido).
 */

/** Master = 1 → volumes do mapa são o volume FINAL efetivo. */
export const NYX_SOUND_VOLUME = 1;

/** Aceleração dos thinking (e success). */
export const NYX_THINKING_PLAYBACK_RATE = 1.55;

export type NyxSoundKey =
  | "thinkingShort"
  | "thinkingLong"
  | "thinkingC"
  | "thinkingD"
  | "thinkingE"
  | "thinkingF"
  | "thinkingG"
  | "thinkingH"
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

const thinking = (n: number): NyxSoundDef => ({
  src: `/nyx/sounds/nyx_thinking_audio${n}.mp3`,
  fileName: `nyx_thinking_audio${n}.mp3`,
  volume: 0.32,
  playbackRate: NYX_THINKING_PLAYBACK_RATE,
});

export const NYX_SOUND_MAP: Record<NyxSoundKey, NyxSoundDef> = {
  thinkingShort: thinking(0),
  thinkingLong: thinking(1),
  thinkingC: thinking(2),
  thinkingD: thinking(3),
  thinkingE: thinking(4),
  thinkingF: thinking(5),
  thinkingG: thinking(6),
  thinkingH: thinking(7),
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

/** Variantes thinking da Nyx (0–7). */
export const NYX_THINKING_KEYS: NyxSoundKey[] = [
  "thinkingShort",
  "thinkingLong",
  "thinkingC",
  "thinkingD",
  "thinkingE",
  "thinkingF",
  "thinkingG",
  "thinkingH",
];

export const NYX_SOUND_STORAGE_KEY = "nyx_sound_enabled";

/** Throttle do typing-soft (ms). */
export const NYX_TYPING_SOUND_THROTTLE_MS = 800;

/** Ordem de preload após unlock. */
export const NYX_SOUND_PRELOAD_ORDER: NyxSoundKey[] = [
  ...NYX_THINKING_KEYS,
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
  ...NYX_THINKING_KEYS,
  "successA",
  "successB",
  "successC",
  "successD",
  "cigarro",
  "cigarroB",
  "cigarroC",
];
