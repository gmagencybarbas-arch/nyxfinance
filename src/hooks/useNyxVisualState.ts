"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NyxVisualState } from "@/components/nyx/avatar/types";

const IDLE_CIGARRO_MS = 90_000;
/** Troca lenta de sprite no modo espera (pedido: ~1 min entre imagens). */
const CIGARRO_SWAP_MS = 60_000;
const SUCESS_HOLD_MIN = 1500;
const SUCESS_HOLD_MAX = 2200;
const ERROR_HOLD_MIN = 1500;
const ERROR_HOLD_MAX = 2200;

function randBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function isBusyState(s: NyxVisualState) {
  return s === "thinking" || s === "typing" || s === "sucess" || s === "error";
}

function isCigarro(s: NyxVisualState) {
  return s === "cigarro01" || s === "cigarro02";
}

/**
 * Máquina de estados dos sprites Nyx Alfa.
 * Timers limpos no unmount; geração evita race de async antigo.
 */
export function useNyxVisualState(initial: NyxVisualState = "master") {
  const [state, setStateRaw] = useState<NyxVisualState>(initial);
  const genRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cigarroTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const stateRef = useRef<NyxVisualState>(initial);

  const clearIdle = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const clearSettle = useCallback(() => {
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  }, []);

  const clearCigarro = useCallback(() => {
    if (cigarroTimerRef.current) {
      clearTimeout(cigarroTimerRef.current);
      cigarroTimerRef.current = null;
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    clearIdle();
    clearSettle();
    clearCigarro();
  }, [clearIdle, clearSettle, clearCigarro]);

  const bumpGen = useCallback(() => {
    genRef.current += 1;
    return genRef.current;
  }, []);

  const applyState = useCallback((next: NyxVisualState) => {
    stateRef.current = next;
    setStateRaw(next);
  }, []);

  /** Alterna cigarro01 ↔ cigarro02 a cada 60s enquanto o gen for o mesmo. */
  const startCigarroLoop = useCallback(
    (gen: number) => {
      clearCigarro();
      const scheduleSwap = () => {
        cigarroTimerRef.current = setTimeout(() => {
          if (!mountedRef.current || genRef.current !== gen) return;
          if (!isCigarro(stateRef.current)) return;
          applyState(stateRef.current === "cigarro01" ? "cigarro02" : "cigarro01");
          scheduleSwap();
        }, CIGARRO_SWAP_MS);
      };
      scheduleSwap();
    },
    [clearCigarro, applyState]
  );

  const scheduleIdleCigarro = useCallback(() => {
    clearIdle();
    clearCigarro();
    idleTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      const current = stateRef.current;
      if (isBusyState(current)) return;

      const gen = bumpGen();
      applyState("cigarro01");
      startCigarroLoop(gen);
    }, IDLE_CIGARRO_MS);
  }, [clearIdle, clearCigarro, bumpGen, applyState, startCigarroLoop]);

  const setState = useCallback(
    (next: NyxVisualState) => {
      bumpGen();
      clearSettle();
      clearCigarro();
      applyState(next);
      if (next === "master") {
        scheduleIdleCigarro();
      } else if (isCigarro(next)) {
        clearIdle();
        startCigarroLoop(genRef.current);
      } else if (next === "sucess") {
        clearIdle();
      } else {
        clearIdle();
      }
    },
    [bumpGen, clearSettle, clearCigarro, clearIdle, applyState, scheduleIdleCigarro, startCigarroLoop]
  );

  /** Interação sem digitar: interrompe cigarro → master */
  const notifyInteraction = useCallback(() => {
    clearIdle();
    clearCigarro();
    bumpGen();
    if (isCigarro(stateRef.current)) {
      applyState("master");
    }
    // Não cancela sucess/error settle — só nova ação (typing/send) cancela
    if (!isBusyState(stateRef.current) || isCigarro(stateRef.current)) {
      scheduleIdleCigarro();
    }
  }, [clearIdle, clearCigarro, bumpGen, applyState, scheduleIdleCigarro]);

  const notifyTyping = useCallback(() => {
    bumpGen();
    clearSettle();
    clearCigarro();
    clearIdle();
    applyState("typing");
    scheduleIdleCigarro();
  }, [bumpGen, clearSettle, clearCigarro, clearIdle, applyState, scheduleIdleCigarro]);

  const notifyTypingCleared = useCallback(() => {
    if (stateRef.current !== "typing") return;
    bumpGen();
    clearSettle();
    applyState("master");
    scheduleIdleCigarro();
  }, [bumpGen, clearSettle, applyState, scheduleIdleCigarro]);

  const notifyMessageSent = useCallback(() => {
    bumpGen();
    clearSettle();
    clearCigarro();
    clearIdle();
    applyState("thinking");
  }, [bumpGen, clearSettle, clearCigarro, clearIdle, applyState]);

  /** Cards / resposta pronta → master (sem sprite de review) */
  const notifyReviewReady = useCallback(() => {
    bumpGen();
    clearSettle();
    clearCigarro();
    applyState("master");
    scheduleIdleCigarro();
  }, [bumpGen, clearSettle, clearCigarro, applyState, scheduleIdleCigarro]);

  /** Sucesso visual curto; áudio pode continuar após voltar ao master. */
  const notifySuccess = useCallback(() => {
    const gen = bumpGen();
    clearSettle();
    clearCigarro();
    clearIdle();
    applyState("sucess");
    settleTimerRef.current = setTimeout(() => {
      if (!mountedRef.current || genRef.current !== gen) return;
      applyState("master");
      scheduleIdleCigarro();
    }, randBetween(SUCESS_HOLD_MIN, SUCESS_HOLD_MAX));
  }, [bumpGen, clearSettle, clearCigarro, clearIdle, applyState, scheduleIdleCigarro]);

  const notifyError = useCallback(() => {
    const gen = bumpGen();
    clearSettle();
    clearCigarro();
    clearIdle();
    applyState("error");
    settleTimerRef.current = setTimeout(() => {
      if (!mountedRef.current || genRef.current !== gen) return;
      applyState("master");
      scheduleIdleCigarro();
    }, randBetween(ERROR_HOLD_MIN, ERROR_HOLD_MAX));
  }, [bumpGen, clearSettle, clearCigarro, clearIdle, applyState, scheduleIdleCigarro]);

  const resetToMaster = useCallback(() => {
    bumpGen();
    clearSettle();
    clearCigarro();
    applyState("master");
    scheduleIdleCigarro();
  }, [bumpGen, clearSettle, clearCigarro, applyState, scheduleIdleCigarro]);

  useEffect(() => {
    mountedRef.current = true;
    scheduleIdleCigarro();
    return () => {
      mountedRef.current = false;
      clearAllTimers();
    };
  }, [scheduleIdleCigarro, clearAllTimers]);

  return {
    state,
    setState,
    notifyTyping,
    notifyTypingCleared,
    notifyMessageSent,
    notifyReviewReady,
    notifySuccess,
    notifyError,
    notifyInteraction,
    resetToMaster,
    /** @deprecated use resetToMaster */
    resetToIdle: resetToMaster,
  };
}
