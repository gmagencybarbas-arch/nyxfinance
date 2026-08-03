/**
 * Mapa de microsons da Nyx (ElevenLabs).
 *
 * Thinking (texto / confirmar lançamento): thinking-pulse*.mp3
 * Thinking voice (só quando o lead manda áudio): nyx_thinking_audio0..7
 */

/** Master = 1 → volumes do mapa são o volume FINAL efetivo. */
export const NYX_SOUND_VOLUME = 1;

/** Aceleração do thinking_audio (fala). */
export const NYX_THINKING_VOICE_PLAYBACK_RATE = 1.55;

/** Aceleração do thinking padrão (pulse). */
export const NYX_THINKING_PLAYBACK_RATE = 1.4;

/** @deprecated Use NYX_THINKING_VOICE_PLAYBACK_RATE */
export const NYX_THINKING_AUDIO_PLAYBACK_RATE = NYX_THINKING_VOICE_PLAYBACK_RATE;

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

/** Modo do thinking: pulse (texto/confirm) vs voice (entrada por áudio). */
export type ThinkingSoundMode = "default" | "voice";

const pulse = (
  file: string,
  volume = 0.32,
  rate = NYX_THINKING_PLAYBACK_RATE
): NyxSoundDef => ({
  src: `/nyx/sounds/${file}`,
  fileName: file,
  volume,
  playbackRate: rate,
});

const thinkingVoice = (n: number): NyxSoundDef => ({
  src: `/nyx/sounds/nyx_thinking_audio${n}.mp3`,
  fileName: `nyx_thinking_audio${n}.mp3`,
  volume: 0.32,
  playbackRate: NYX_THINKING_VOICE_PLAYBACK_RATE,
});

export const NYX_SOUND_MAP: Record<NyxSoundKey, NyxSoundDef> = {
  thinkingShort: pulse("thinking-pulse1.mp3"),
  thinkingLong: pulse("thinking-pulse.mp3", 0.3),
  thinkingC: pulse("thinking-pulse2.mp3"),
  thinkingD: pulse("thinking-pulse3.mp3"),
  thinkingE: pulse("thinking-pulse4.mp3"),
  // Slots extras (não entram no sorteio padrão; aliases dos pulses)
  thinkingF: pulse("thinking-pulse2.mp3"),
  thinkingG: pulse("thinking-pulse3.mp3"),
  thinkingH: pulse("thinking-pulse4.mp3"),
  successA: {
    src: "/nyx/sounds/success-chime.mp3",
    fileName: "success-chime.mp3",
    volume: 0.52,
    playbackRate: 1.25,
  },
  successB: {
    src: "/nyx/sounds/success-chime1.mp3",
    fileName: "success-chime1.mp3",
    volume: 0.52,
    playbackRate: 1.25,
  },
  successC: {
    src: "/nyx/sounds/success-chime2.mp3",
    fileName: "success-chime2.mp3",
    volume: 0.52,
    playbackRate: 1.25,
  },
  successD: {
    src: "/nyx/sounds/success-chime4.mp3",
    fileName: "success-chime4.mp3",
    volume: 0.52,
    playbackRate: 1.25,
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

/** Thinking padrão (texto + confirmar lançamento). */
export const NYX_THINKING_KEYS: NyxSoundKey[] = [
  "thinkingShort",
  "thinkingLong",
  "thinkingC",
  "thinkingD",
  "thinkingE",
];

/** Thinking_audio — só quando o lead manda áudio. */
export const NYX_THINKING_VOICE_DEFS: NyxSoundDef[] = [
  thinkingVoice(0),
  thinkingVoice(1),
  thinkingVoice(2),
  thinkingVoice(3),
  thinkingVoice(4),
  thinkingVoice(5),
  thinkingVoice(6),
  thinkingVoice(7),
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
