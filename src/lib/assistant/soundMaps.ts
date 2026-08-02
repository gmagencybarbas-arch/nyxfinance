import type { AudioKey } from "@/lib/assistant/ids";
import {
  NYX_SOUND_MAP,
  NYX_THINKING_KEYS,
  NYX_THINKING_VOICE_DEFS,
  type NyxSoundDef,
  type NyxSoundKey,
  type ThinkingSoundMode,
} from "@/lib/nyx/audio/nyxSoundMap";
import {
  EVA_CIGARRO_EXTRA,
  EVA_SOUND_MAP,
  EVA_SUCCESS_EXTRA,
  EVA_THINKING_KEYS,
  EVA_THINKING_VOICE_DEFS,
} from "@/lib/assistant/evaSoundMap";

export type CharacterSoundMap = Record<NyxSoundKey, NyxSoundDef>;

export function getCharacterSoundMap(audioKey: AudioKey): CharacterSoundMap {
  return audioKey === "eva" ? EVA_SOUND_MAP : NYX_SOUND_MAP;
}

/** Thinking padrão (texto / confirmar lançamento). */
export function getThinkingKeys(audioKey: AudioKey): NyxSoundKey[] {
  return audioKey === "eva" ? EVA_THINKING_KEYS : NYX_THINKING_KEYS;
}

/**
 * Thinking_audio — só quando o lead manda áudio.
 * Nyx: nyx_thinking_audio0..7 | Eva: eva_thinking_audio0..5
 */
export function getThinkingVoiceDefs(audioKey: AudioKey): NyxSoundDef[] {
  return audioKey === "eva" ? EVA_THINKING_VOICE_DEFS : NYX_THINKING_VOICE_DEFS;
}

export type { ThinkingSoundMode };

/** Definições extras só da Eva (sorteio junto com as chaves principais). */
export function getExtraSuccessDefs(audioKey: AudioKey): NyxSoundDef[] {
  return audioKey === "eva" ? [EVA_SUCCESS_EXTRA] : [];
}

export function getExtraCigaretteDefs(audioKey: AudioKey): NyxSoundDef[] {
  return audioKey === "eva" ? [EVA_CIGARRO_EXTRA] : [];
}
