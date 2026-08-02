"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAssistantOptional } from "@/contexts/AssistantContext";
import type { AudioKey } from "@/lib/assistant/ids";
import {
  getCharacterSoundMap,
  getExtraCigaretteDefs,
  getExtraSuccessDefs,
  getThinkingKeys,
  getThinkingVoiceDefs,
  type CharacterSoundMap,
  type ThinkingSoundMode,
} from "@/lib/assistant/soundMaps";
import {
  NYX_MAIN_SOUND_KEYS,
  NYX_SOUND_PRELOAD_ORDER,
  NYX_SOUND_STORAGE_KEY,
  NYX_SOUND_VOLUME,
  NYX_TYPING_SOUND_THROTTLE_MS,
  NYX_THINKING_KEYS,
  type NyxSoundDef,
  type NyxSoundKey,
} from "@/lib/nyx/audio/nyxSoundMap";

type AudioPool = Partial<Record<NyxSoundKey, HTMLAudioElement>>;
type ThinkingPick = NyxSoundKey;
type ThinkingTarget =
  | { mode: "default"; key: ThinkingPick }
  | { mode: "voice"; def: NyxSoundDef; token: string };
type SuccessPick = "successA" | "successB" | "successC" | "successD";
type CigarettePick = "cigarro" | "cigarroB" | "cigarroC";

const SUCCESS_KEYS: SuccessPick[] = ["successA", "successB", "successC", "successD"];
const CIGARETTE_KEYS: CigarettePick[] = ["cigarro", "cigarroB", "cigarroC"];

/** Slots thinking padrão (pulse / eva_thinking). */
const ALL_THINKING_KEYS: NyxSoundKey[] = NYX_THINKING_KEYS;

/** Sons reais (ElevenLabs). Opcionais ausentes não devem ser tocados. */
const REAL_SOUND_KEYS = new Set<NyxSoundKey>([
  ...ALL_THINKING_KEYS,
  ...SUCCESS_KEYS,
  ...CIGARETTE_KEYS,
]);

function resolveAudioKey(raw: string | undefined): AudioKey {
  return raw === "eva" ? "eva" : "nyx";
}

function randomWithoutImmediateRepeat<T>(items: T[], previous: T | null): T {
  const available = previous === null ? items : items.filter((item) => item !== previous);
  return available[Math.floor(Math.random() * available.length)] ?? items[0]!;
}

function isDev() {
  return process.env.NODE_ENV === "development";
}

function logAudio(message: string) {
  if (isDev()) {
    console.log(`[Assistant Audio] ${message}`);
  }
}

function readStoredEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const v = localStorage.getItem(NYX_SOUND_STORAGE_KEY);
    if (v === null) return true;
    return v === "1" || v === "true";
  } catch {
    return true;
  }
}

function writeStoredEnabled(enabled: boolean) {
  try {
    localStorage.setItem(NYX_SOUND_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    /* noop */
  }
}

function applyPlayback(el: HTMLAudioElement, def: NyxSoundDef) {
  try {
    el.volume = Math.min(1, Math.max(0, def.volume * NYX_SOUND_VOLUME));
    el.playbackRate = def.playbackRate;
    el.loop = Boolean(def.loop);
  } catch {
    /* alguns browsers rejeitam rate antes do load — ok */
  }
}

function safePauseReset(el: HTMLAudioElement) {
  try {
    el.pause();
  } catch {
    /* noop */
  }
  try {
    if (el.readyState > 0) el.currentTime = 0;
  } catch {
    /* noop */
  }
}

function disposePool(pool: AudioPool) {
  (Object.keys(pool) as NyxSoundKey[]).forEach((k) => {
    const el = pool[k];
    if (!el) return;
    try {
      el.pause();
      el.removeAttribute("src");
      el.load();
    } catch {
      /* noop */
    }
  });
}

/**
 * Camada de microsons por personagem (mapa independente Nyx vs Eva).
 * Sem fallback permanente Eva→Nyx; só skip se arquivo específico falhar.
 */
export function useNyxSounds() {
  const assistant = useAssistantOptional();
  const audioKey = resolveAudioKey(assistant?.activeAudioKey);

  const [enabled, setEnabledState] = useState(true);
  const unlockedRef = useRef(false);
  const preloadedRef = useRef(false);
  const poolRef = useRef<AudioPool>({});
  const missingRef = useRef<Set<NyxSoundKey>>(new Set());
  const lastTypingAtRef = useRef(0);
  const mountedRef = useRef(true);
  const activeMainRef = useRef<NyxSoundKey | null>(null);
  const soundMapRef = useRef<CharacterSoundMap>(getCharacterSoundMap(audioKey));
  const audioKeyRef = useRef<AudioKey>(audioKey);
  const extraPoolRef = useRef<HTMLAudioElement[]>([]);

  const lastThinkingRef = useRef<ThinkingPick | null>(null);
  const lastThinkingVoiceTokenRef = useRef<string | null>(null);
  const preparedThinkingRef = useRef<ThinkingTarget | null>(null);
  const activeVoiceThinkingRef = useRef<HTMLAudioElement | null>(null);
  const lastSuccessTokenRef = useRef<string | null>(null);
  const lastCigaretteTokenRef = useRef<string | null>(null);
  const thinkingEndedResolveRef = useRef<(() => void) | null>(null);
  const thinkingWaitRef = useRef<Promise<void>>(Promise.resolve());
  const thinkingGenRef = useRef(0);

  const resolveThinkingEnded = useCallback((gen?: number) => {
    if (gen !== undefined && gen !== thinkingGenRef.current) return;
    const resolve = thinkingEndedResolveRef.current;
    thinkingEndedResolveRef.current = null;
    resolve?.();
  }, []);

  const pickThinking = useCallback((): ThinkingPick => {
    const keys = getThinkingKeys(audioKeyRef.current);
    const pick = randomWithoutImmediateRepeat(keys, lastThinkingRef.current);
    lastThinkingRef.current = pick;
    return pick;
  }, []);

  const pickThinkingVoice = useCallback((): { def: NyxSoundDef; token: string } => {
    const defs = getThinkingVoiceDefs(audioKeyRef.current);
    const tokens = defs.map((d) => d.fileName);
    const token = randomWithoutImmediateRepeat(tokens, lastThinkingVoiceTokenRef.current);
    lastThinkingVoiceTokenRef.current = token;
    const def = defs.find((d) => d.fileName === token) ?? defs[0]!;
    return { def, token };
  }, []);

  const holdMsForDef = useCallback((def: NyxSoundDef, el?: HTMLAudioElement | null) => {
    const rate = def.playbackRate || 1.4;
    if (el && Number.isFinite(el.duration) && el.duration > 0) {
      return Math.ceil((el.duration / rate) * 1000) + 80;
    }
    // Fallback antes do metadata carregar
    return def.fileName.includes("thinking_audio")
      ? 2800 + Math.random() * 2200
      : 1800 + Math.random() * 1600;
  }, []);

  const holdMsForPick = useCallback(
    (pick: ThinkingPick) => {
      const def = soundMapRef.current[pick];
      return holdMsForDef(def, poolRef.current[pick]);
    },
    [holdMsForDef]
  );

  /**
   * Prepara thinking:
   * - `default` → thinking-pulse / eva_thinking (texto + confirmar)
   * - `voice` → *_thinking_audio* (só entrada por áudio)
   */
  const prepareThinking = useCallback(
    (mode: ThinkingSoundMode = "default") => {
      const gen = ++thinkingGenRef.current;

      thinkingWaitRef.current = new Promise<void>((resolve) => {
        thinkingEndedResolveRef.current = resolve;
      });

      if (mode === "voice") {
        const { def, token } = pickThinkingVoice();
        preparedThinkingRef.current = { mode: "voice", def, token };
        const holdMs = holdMsForDef(def);
        return {
          holdMs,
          mode,
          variant: "short" as const,
          fileName: def.fileName,
          waitUntilEnded: () => thinkingWaitRef.current,
          gen,
        };
      }

      const pick = pickThinking();
      preparedThinkingRef.current = { mode: "default", key: pick };
      const holdMs = holdMsForPick(pick);
      return {
        holdMs,
        mode,
        variant: (pick === "thinkingLong" ? "long" : "short") as "short" | "long",
        fileName: soundMapRef.current[pick].fileName,
        waitUntilEnded: () => thinkingWaitRef.current,
        gen,
      };
    },
    [pickThinking, pickThinkingVoice, holdMsForPick, holdMsForDef]
  );

  useEffect(() => {
    mountedRef.current = true;
    setEnabledState(readStoredEnabled());
    return () => {
      mountedRef.current = false;
      disposePool(poolRef.current);
      poolRef.current = {};
      for (const el of extraPoolRef.current) {
        try {
          el.pause();
          el.removeAttribute("src");
        } catch {
          /* noop */
        }
      }
      extraPoolRef.current = [];
    };
  }, []);

  // Troca de personagem: limpa pool e reconstrói com o mapa correto
  useEffect(() => {
    if (audioKeyRef.current === audioKey) {
      soundMapRef.current = getCharacterSoundMap(audioKey);
      return;
    }
    audioKeyRef.current = audioKey;
    soundMapRef.current = getCharacterSoundMap(audioKey);
    disposePool(poolRef.current);
    poolRef.current = {};
    for (const el of extraPoolRef.current) {
      try {
        el.pause();
        el.removeAttribute("src");
      } catch {
        /* noop */
      }
    }
    extraPoolRef.current = [];
    missingRef.current = new Set();
    preloadedRef.current = false;
    activeMainRef.current = null;
    preparedThinkingRef.current = null;
    lastThinkingRef.current = null;
    lastThinkingVoiceTokenRef.current = null;
    activeVoiceThinkingRef.current = null;
    lastSuccessTokenRef.current = null;
    lastCigaretteTokenRef.current = null;
    if (unlockedRef.current) {
      for (const key of NYX_SOUND_PRELOAD_ORDER) {
        if (!REAL_SOUND_KEYS.has(key)) continue;
        // getAudio recriado abaixo — preload lazy no próximo play/unlock
      }
      preloadedRef.current = false;
    }
  }, [audioKey]);

  const stopKey = useCallback((key: NyxSoundKey) => {
    const el = poolRef.current[key];
    if (!el) return;
    safePauseReset(el);
    if (activeMainRef.current === key) {
      activeMainRef.current = null;
    }
  }, []);

  const stopMainSounds = useCallback(() => {
    for (const key of NYX_MAIN_SOUND_KEYS) {
      stopKey(key);
    }
    for (const el of extraPoolRef.current) {
      safePauseReset(el);
    }
  }, [stopKey]);

  const setEnabled = useCallback(
    (next: boolean) => {
      setEnabledState(next);
      writeStoredEnabled(next);
      if (!next) stopMainSounds();
    },
    [stopMainSounds]
  );

  const getAudio = useCallback((key: NyxSoundKey): HTMLAudioElement | null => {
    if (typeof window === "undefined") return null;
    if (!REAL_SOUND_KEYS.has(key)) {
      missingRef.current.add(key);
      return null;
    }
    if (missingRef.current.has(key)) return null;

    const existing = poolRef.current[key];
    if (existing) return existing;

    const def = soundMapRef.current[key];
    try {
      const el = new Audio();
      el.preload = "auto";
      el.src = encodeURI(def.src);
      applyPlayback(el, def);
      el.addEventListener("error", () => {
        missingRef.current.add(key);
        delete poolRef.current[key];
        logAudio(`missing/unsupported: ${def.fileName}`);
      });
      el.addEventListener("ended", () => {
        if (activeMainRef.current === key) {
          activeMainRef.current = null;
        }
      });
      poolRef.current[key] = el;
      return el;
    } catch {
      missingRef.current.add(key);
      return null;
    }
  }, []);

  const preloadAll = useCallback(() => {
    if (preloadedRef.current) return;
    preloadedRef.current = true;
    for (const key of NYX_SOUND_PRELOAD_ORDER) {
      getAudio(key);
    }
    // Prefetch thinking_audio (só usado em entrada por voz)
    for (const def of getThinkingVoiceDefs(audioKeyRef.current)) {
      try {
        const el = new Audio();
        el.preload = "auto";
        el.src = encodeURI(def.src);
      } catch {
        /* noop */
      }
    }
  }, [getAudio]);

  const unlock = useCallback(() => {
    if (!unlockedRef.current) {
      unlockedRef.current = true;
      preloadAll();
    }
  }, [preloadAll]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mark = () => unlock();
    window.addEventListener("pointerdown", mark, { once: true, passive: true });
    window.addEventListener("keydown", mark, { once: true });
    return () => {
      window.removeEventListener("pointerdown", mark);
      window.removeEventListener("keydown", mark);
    };
  }, [unlock]);

  // Após troca de personagem, se já desbloqueado, pré-carrega o novo mapa
  useEffect(() => {
    if (unlockedRef.current) preloadAll();
  }, [audioKey, preloadAll]);

  const canPlay = useCallback(() => {
    if (!mountedRef.current) return false;
    if (!enabled) return false;
    if (!unlockedRef.current) return false;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return false;
    }
    return true;
  }, [enabled]);

  const playKey = useCallback(
    async (key: NyxSoundKey, reason?: string) => {
      try {
        if (!canPlay()) return;
        if (!REAL_SOUND_KEYS.has(key)) return;
        const el = getAudio(key);
        if (!el) return;
        const def = soundMapRef.current[key];

        safePauseReset(el);
        applyPlayback(el, def);
        activeMainRef.current = key;

        const p = el.play();
        if (p !== undefined) {
          await p.catch((err: unknown) => {
            const name = err instanceof DOMException ? err.name : "";
            if (isDev() && name && name !== "AbortError") {
              logAudio(`play blocked (${name}): ${def.fileName}`);
            }
            if (name === "NotSupportedError") {
              missingRef.current.add(key);
            }
            if (activeMainRef.current === key) activeMainRef.current = null;
          });
        }

        if (activeMainRef.current === key && !el.paused) {
          logAudio(
            `${reason ?? "play"} started: ${def.fileName} rate=${def.playbackRate}`
          );
        }
      } catch {
        if (activeMainRef.current === key) activeMainRef.current = null;
      }
    },
    [canPlay, getAudio]
  );

  const playDef = useCallback(
    async (def: NyxSoundDef, reason?: string) => {
      try {
        if (!canPlay()) return;
        if (typeof window === "undefined") return;
        const el = new Audio();
        el.preload = "auto";
        el.src = encodeURI(def.src);
        applyPlayback(el, def);
        extraPoolRef.current.push(el);
        el.addEventListener("error", () => {
          logAudio(`missing/unsupported extra: ${def.fileName}`);
        });
        const p = el.play();
        if (p !== undefined) {
          await p.catch((err: unknown) => {
            const name = err instanceof DOMException ? err.name : "";
            if (isDev() && name && name !== "AbortError") {
              logAudio(`play blocked (${name}): ${def.fileName}`);
            }
          });
        }
        if (!el.paused) {
          logAudio(
            `${reason ?? "play"} started: ${def.fileName} rate=${def.playbackRate}`
          );
        }
      } catch {
        /* noop */
      }
    },
    [canPlay]
  );

  const pickSuccessTarget = useCallback(():
    | { kind: "key"; key: SuccessPick }
    | { kind: "def"; def: NyxSoundDef } => {
    const extras = getExtraSuccessDefs(audioKeyRef.current);
    const options: Array<
      | { kind: "key"; key: SuccessPick; token: string }
      | { kind: "def"; def: NyxSoundDef; token: string }
    > = [
      ...SUCCESS_KEYS.map((k) => ({ kind: "key" as const, key: k, token: k })),
      ...extras.map((def, i) => ({
        kind: "def" as const,
        def,
        token: `extra-success-${i}`,
      })),
    ];
    const tokenList = options.map((o) => o.token);
    const token = randomWithoutImmediateRepeat(tokenList, lastSuccessTokenRef.current);
    lastSuccessTokenRef.current = token;
    const pick = options.find((o) => o.token === token)!;
    if (pick.kind === "key") return { kind: "key", key: pick.key };
    return { kind: "def", def: pick.def };
  }, []);

  const pickCigaretteTarget = useCallback(():
    | { kind: "key"; key: CigarettePick }
    | { kind: "def"; def: NyxSoundDef } => {
    const extras = getExtraCigaretteDefs(audioKeyRef.current);
    const options: Array<
      | { kind: "key"; key: CigarettePick; token: string }
      | { kind: "def"; def: NyxSoundDef; token: string }
    > = [
      ...CIGARETTE_KEYS.map((k) => ({ kind: "key" as const, key: k, token: k })),
      ...extras.map((def, i) => ({
        kind: "def" as const,
        def,
        token: `extra-cigarro-${i}`,
      })),
    ];
    const tokenList = options.map((o) => o.token);
    const token = randomWithoutImmediateRepeat(
      tokenList,
      lastCigaretteTokenRef.current
    );
    lastCigaretteTokenRef.current = token;
    const pick = options.find((o) => o.token === token)!;
    if (pick.kind === "key") return { kind: "key", key: pick.key };
    return { kind: "def", def: pick.def };
  }, []);

  const isMainBusyBlockingTyping = useCallback(() => {
    const active = activeMainRef.current;
    if (!active) return false;
    return REAL_SOUND_KEYS.has(active);
  }, []);

  const stopAll = useCallback(() => {
    stopMainSounds();
  }, [stopMainSounds]);

  const playTyping = useCallback(() => {
    if (!canPlay()) return;
    if (isMainBusyBlockingTyping()) return;
    const now = Date.now();
    if (now - lastTypingAtRef.current < NYX_TYPING_SOUND_THROTTLE_MS) return;
    lastTypingAtRef.current = now;
  }, [canPlay, isMainBusyBlockingTyping]);

  const playThinking = useCallback(() => {
    stopMainSounds();
    const prepared =
      preparedThinkingRef.current ??
      ({ mode: "default", key: pickThinking() } satisfies ThinkingTarget);
    preparedThinkingRef.current = null;
    const gen = thinkingGenRef.current;
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      if (activeVoiceThinkingRef.current) {
        safePauseReset(activeVoiceThinkingRef.current);
        activeVoiceThinkingRef.current = null;
      }
      resolveThinkingEnded(gen);
    };

    if (prepared.mode === "voice") {
      const def = prepared.def;
      if (!canPlay() || typeof window === "undefined") {
        window.setTimeout(finish, holdMsForDef(def));
        return;
      }
      const el = new Audio();
      el.preload = "auto";
      el.src = encodeURI(def.src);
      applyPlayback(el, def);
      activeVoiceThinkingRef.current = el;
      extraPoolRef.current.push(el);

      const onEnded = () => {
        el.removeEventListener("ended", onEnded);
        if (activeVoiceThinkingRef.current === el) {
          activeVoiceThinkingRef.current = null;
        }
        finish();
      };
      el.addEventListener("ended", onEnded);
      el.addEventListener("error", () => {
        el.removeEventListener("ended", onEnded);
        finish();
      });

      void el.play().then(
        () => {
          logAudio(`thinking voice started: ${def.fileName}`);
          const maxWait = Math.max(holdMsForDef(def, el) + 1500, 4000);
          window.setTimeout(() => {
            el.removeEventListener("ended", onEnded);
            finish();
          }, maxWait);
        },
        () => {
          el.removeEventListener("ended", onEnded);
          finish();
        }
      );
      return;
    }

    const pick = prepared.key;
    const def = soundMapRef.current[pick];
    const el = getAudio(pick);

    if (!canPlay() || !el) {
      window.setTimeout(finish, holdMsForPick(pick));
      return;
    }

    const onEnded = () => {
      el.removeEventListener("ended", onEnded);
      finish();
    };
    el.addEventListener("ended", onEnded);

    void playKey(pick, "thinking").then(() => {
      window.setTimeout(() => {
        if (el.paused && el.currentTime < 0.05) {
          el.removeEventListener("ended", onEnded);
          finish();
        }
      }, 400);
      const maxWait = Math.max(holdMsForPick(pick) + 1500, 4000);
      window.setTimeout(() => {
        el.removeEventListener("ended", onEnded);
        finish();
      }, maxWait);
    });

    logAudio(`thinking prepared play: ${def.fileName}`);
  }, [
    stopMainSounds,
    pickThinking,
    playKey,
    getAudio,
    canPlay,
    holdMsForPick,
    holdMsForDef,
    resolveThinkingEnded,
  ]);

  const stopThinking = useCallback(
    (reason = "interpretation ready") => {
      const keys = getThinkingKeys(audioKeyRef.current);
      const was =
        activeMainRef.current !== null &&
        keys.includes(activeMainRef.current);
      for (const key of ALL_THINKING_KEYS) stopKey(key);
      if (activeVoiceThinkingRef.current) {
        safePauseReset(activeVoiceThinkingRef.current);
        activeVoiceThinkingRef.current = null;
      }
      if (was) logAudio(`thinking stopped: ${reason}`);
      resolveThinkingEnded(thinkingGenRef.current);
    },
    [stopKey, resolveThinkingEnded]
  );

  const playResponse = useCallback(() => {
    stopThinking("interpretation ready");
  }, [stopThinking]);

  const playSuccess = useCallback(() => {
    stopMainSounds();
    const target = pickSuccessTarget();
    if (target.kind === "key") void playKey(target.key, "success");
    else void playDef(target.def, "success");
  }, [stopMainSounds, pickSuccessTarget, playKey, playDef]);

  const playError = useCallback(() => {
    stopMainSounds();
  }, [stopMainSounds]);

  const playCigarette = useCallback(() => {
    stopMainSounds();
    const target = pickCigaretteTarget();
    if (target.kind === "key") void playKey(target.key, "cigarette");
    else void playDef(target.def, "cigarette");
  }, [stopMainSounds, pickCigaretteTarget, playKey, playDef]);

  const stopCigarette = useCallback(() => {
    for (const key of CIGARETTE_KEYS) stopKey(key);
    for (const el of extraPoolRef.current) safePauseReset(el);
  }, [stopKey]);

  return {
    enabled,
    setEnabled,
    unlock,
    playTyping,
    prepareThinking,
    playThinking,
    stopThinking,
    playResponse,
    playSuccess,
    playError,
    playCigarette,
    stopCigarette,
    playLighter: playCigarette,
    startCigaretteAmbient: () => {},
    stopCigaretteAmbient: stopCigarette,
    stopAll,
  };
}
