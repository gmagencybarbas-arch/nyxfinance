/**
 * Mapa de microsons da Eva.
 * Independente da Nyx — arquivos em public/eva/sounds/
 *
 * Mesmas chaves semânticas (thinking/success/cigarro) para o player compartilhado.
 * Playback rate alinhado à Nyx (thinking/success 1.4, cigarro 1.2).
 */

import type { NyxSoundDef, NyxSoundKey } from "@/lib/nyx/audio/nyxSoundMap";

const base = "/eva/sounds";

export const EVA_SOUND_MAP: Record<NyxSoundKey, NyxSoundDef> = {
  thinkingShort: {
    src: `${base}/eva_thinking.mp3`,
    fileName: "eva_thinking.mp3",
    volume: 0.32,
    playbackRate: 1.4,
  },
  thinkingLong: {
    src: `${base}/eva_thinking1.mp3`,
    fileName: "eva_thinking1.mp3",
    volume: 0.3,
    playbackRate: 1.4,
  },
  thinkingC: {
    src: `${base}/eva_thinking2.mp3`,
    fileName: "eva_thinking2.mp3",
    volume: 0.32,
    playbackRate: 1.4,
  },
  thinkingD: {
    src: `${base}/eva_thinking3.mp3`,
    fileName: "eva_thinking3.mp3",
    volume: 0.32,
    playbackRate: 1.4,
  },
  thinkingE: {
    src: `${base}/eva_thinking4.mp3`,
    fileName: "eva_thinking4.mp3",
    volume: 0.32,
    playbackRate: 1.4,
  },
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
