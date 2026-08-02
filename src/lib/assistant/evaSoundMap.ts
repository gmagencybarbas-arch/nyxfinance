/**
 * Mapa de microsons da Eva.
 * Independente da Nyx — arquivos em public/eva/sounds/
 *
 * Thinking (texto / confirmar): eva_thinking*.mp3
 * Thinking voice (só áudio do lead): eva_thinking_audio0..5
 */

import {
  NYX_THINKING_PLAYBACK_RATE,
  NYX_THINKING_VOICE_PLAYBACK_RATE,
  type NyxSoundDef,
  type NyxSoundKey,
} from "@/lib/nyx/audio/nyxSoundMap";

const base = "/eva/sounds";

const thinking = (
  file: string,
  volume = 0.32,
  rate = NYX_THINKING_PLAYBACK_RATE
): NyxSoundDef => ({
  src: `${base}/${file}`,
  fileName: file,
  volume,
  playbackRate: rate,
});

const thinkingVoice = (n: number): NyxSoundDef => ({
  src: `${base}/eva_thinking_audio${n}.mp3`,
  fileName: `eva_thinking_audio${n}.mp3`,
  volume: 0.32,
  playbackRate: NYX_THINKING_VOICE_PLAYBACK_RATE,
});

export const EVA_SOUND_MAP: Record<NyxSoundKey, NyxSoundDef> = {
  thinkingShort: thinking("eva_thinking.mp3"),
  thinkingLong: thinking("eva_thinking1.mp3", 0.3),
  thinkingC: thinking("eva_thinking2.mp3"),
  thinkingD: thinking("eva_thinking3.mp3"),
  thinkingE: thinking("eva_thinking4.mp3"),
  // Slots extras (não entram no sorteio padrão)
  thinkingF: thinking("eva_thinking2.mp3"),
  thinkingG: thinking("eva_thinking3.mp3"),
  thinkingH: thinking("eva_thinking4.mp3"),
  successA: {
    src: `${base}/eva_sucesso.mp3`,
    fileName: "eva_sucesso.mp3",
    volume: 0.38,
    playbackRate: 1.4,
  },
  successB: {
    src: `${base}/eva_sucesso1.mp3`,
    fileName: "eva_sucesso1.mp3",
    volume: 0.38,
    playbackRate: 1.4,
  },
  successC: {
    src: `${base}/eva_sucesso2.mp3`,
    fileName: "eva_sucesso2.mp3",
    volume: 0.38,
    playbackRate: 1.4,
  },
  successD: {
    src: `${base}/eva_sucesso3.mp3`,
    fileName: "eva_sucesso3.mp3",
    volume: 0.38,
    playbackRate: 1.4,
  },
  cigarro: {
    src: `${base}/eva_cigarro.mp3`,
    fileName: "eva_cigarro.mp3",
    volume: 0.24,
    playbackRate: 1.2,
  },
  cigarroB: {
    src: `${base}/eva_cigarro1.mp3`,
    fileName: "eva_cigarro1.mp3",
    volume: 0.24,
    playbackRate: 1.2,
  },
  cigarroC: {
    src: `${base}/eva_cigarro2.mp3`,
    fileName: "eva_cigarro2.mp3",
    volume: 0.24,
    playbackRate: 1.2,
  },
  typing: {
    src: `${base}/eva_thinking.mp3`,
    fileName: "eva_thinking.mp3",
    volume: 0.08,
    playbackRate: 1,
  },
  response: {
    src: `${base}/eva_sucesso.mp3`,
    fileName: "eva_sucesso.mp3",
    volume: 0.12,
    playbackRate: 1,
  },
  error: {
    src: `${base}/eva_thinking.mp3`,
    fileName: "eva_thinking.mp3",
    volume: 0.1,
    playbackRate: 1,
  },
};

/** Thinking padrão da Eva (texto + confirmar). */
export const EVA_THINKING_KEYS: NyxSoundKey[] = [
  "thinkingShort",
  "thinkingLong",
  "thinkingC",
  "thinkingD",
  "thinkingE",
];

/** Thinking_audio — só quando o lead manda áudio. */
export const EVA_THINKING_VOICE_DEFS: NyxSoundDef[] = [
  thinkingVoice(0),
  thinkingVoice(1),
  thinkingVoice(2),
  thinkingVoice(3),
  thinkingVoice(4),
  thinkingVoice(5),
];

/** Variantes extras só da Eva (sucesso4 / cigarro3) — sorteadas junto com as chaves principais. */
export const EVA_SUCCESS_EXTRA: NyxSoundDef = {
  src: `${base}/eva_sucesso4.mp3`,
  fileName: "eva_sucesso4.mp3",
  volume: 0.38,
  playbackRate: 1.4,
};

export const EVA_CIGARRO_EXTRA: NyxSoundDef = {
  src: `${base}/eva_cigarro3.mp3`,
  fileName: "eva_cigarro3.mp3",
  volume: 0.24,
  playbackRate: 1.2,
};
