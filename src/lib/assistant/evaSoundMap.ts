/**
 * Mapa de microsons da Eva.
 * Independente da Nyx — arquivos em public/eva/sounds/
 *
 * Thinking: eva_thinking_audio0..5
 * Playback rate alinhado à Nyx (thinking acelerado).
 */

import {
  NYX_THINKING_PLAYBACK_RATE,
  type NyxSoundDef,
  type NyxSoundKey,
} from "@/lib/nyx/audio/nyxSoundMap";

const base = "/eva/sounds";

const thinking = (n: number): NyxSoundDef => ({
  src: `${base}/eva_thinking_audio${n}.mp3`,
  fileName: `eva_thinking_audio${n}.mp3`,
  volume: 0.32,
  playbackRate: NYX_THINKING_PLAYBACK_RATE,
});

export const EVA_SOUND_MAP: Record<NyxSoundKey, NyxSoundDef> = {
  thinkingShort: thinking(0),
  thinkingLong: thinking(1),
  thinkingC: thinking(2),
  thinkingD: thinking(3),
  thinkingE: thinking(4),
  thinkingF: thinking(5),
  // Nyx tem 8 slots; Eva reusa 0–5 sem arquivo extra (não entram no pool de sorteio da Eva)
  thinkingG: thinking(0),
  thinkingH: thinking(1),
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
    src: `${base}/eva_thinking_audio0.mp3`,
    fileName: "eva_thinking_audio0.mp3",
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
    src: `${base}/eva_thinking_audio0.mp3`,
    fileName: "eva_thinking_audio0.mp3",
    volume: 0.1,
    playbackRate: 1,
  },
};

/** Variantes thinking da Eva (0–5). */
export const EVA_THINKING_KEYS: NyxSoundKey[] = [
  "thinkingShort",
  "thinkingLong",
  "thinkingC",
  "thinkingD",
  "thinkingE",
  "thinkingF",
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
