import type { AudioKey } from "@/lib/assistant/ids";
import {
  NYX_SOUND_MAP,
  type NyxSoundDef,
  type NyxSoundKey,
} from "@/lib/nyx/audio/nyxSoundMap";
import {
  EVA_CIGARRO_EXTRA,
  EVA_SOUND_MAP,
  EVA_SUCCESS_EXTRA,
} from "@/lib/assistant/evaSoundMap";

export type CharacterSoundMap = Record<NyxSoundKey, NyxSoundDef>;

export function getCharacterSoundMap(audioKey: AudioKey): CharacterSoundMap {
  return audioKey === "eva" ? EVA_SOUND_MAP : NYX_SOUND_MAP;
}

/** Definições extras só da Eva (sorteio junto com as chaves principais). */
export function getExtraSuccessDefs(audioKey: AudioKey): NyxSoundDef[] {
  return audioKey === "eva" ? [EVA_SUCCESS_EXTRA] : [];
}

export function getExtraCigaretteDefs(audioKey: AudioKey): NyxSoundDef[] {
  return audioKey === "eva" ? [EVA_CIGARRO_EXTRA] : [];
}
