"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MAX_RECORDING_MS,
  MIN_RECORDING_MS,
  pickRecorderMimeType,
} from "@/lib/audio/constants";

export type VoiceRecorderState =
  | "idle"
  | "requesting_permission"
  | "recording"
  | "stopping"
  | "error";

type UseVoiceRecorderResult = {
  state: VoiceRecorderState;
  error: string | null;
  elapsedMs: number;
  mimeType: string;
  start: () => Promise<void>;
  stop: () => Promise<Blob | null>;
  cancel: () => void;
  clearError: () => void;
};

/**
 * MediaRecorder com fallbacks Safari (audio/mp4) e Chrome (webm).
 * Uma gravação por vez; auto-stop em MAX_RECORDING_MS preserva o blob.
 */
export function useVoiceRecorder(): UseVoiceRecorderResult {
  const [state, setState] = useState<VoiceRecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [mimeType, setMimeType] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopResolverRef = useRef<((blob: Blob | null) => void) | null>(null);
  /** Blob pronto após stop/auto-stop, até o consumidor chamar stop()/cancel(). */
  const pendingBlobRef = useRef<Blob | null>(null);
  const stateRef = useRef<VoiceRecorderState>("idle");

  const setRecorderState = useCallback((next: VoiceRecorderState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const clearTimers = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
  }, []);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const resetSession = useCallback(() => {
    clearTimers();
    releaseStream();
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    startedAtRef.current = 0;
    setElapsedMs(0);
  }, [clearTimers, releaseStream]);

  useEffect(() => {
    return () => {
      try {
        mediaRecorderRef.current?.stop();
      } catch {
        /* noop */
      }
      pendingBlobRef.current = null;
      resetSession();
      stopResolverRef.current?.(null);
      stopResolverRef.current = null;
    };
  }, [resetSession]);

  const start = useCallback(async () => {
    const current = stateRef.current;
    if (
      current === "recording" ||
      current === "requesting_permission" ||
      current === "stopping"
    ) {
      return;
    }
    if (typeof window === "undefined") return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Este navegador não permite gravar áudio.");
      setRecorderState("error");
      return;
    }

    setError(null);
    pendingBlobRef.current = null;
    setRecorderState("requesting_permission");
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
        },
      });
      streamRef.current = stream;

      const mime = pickRecorderMimeType();
      setMimeType(mime);
      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunksRef.current.push(ev.data);
        }
      };

      recorder.onerror = () => {
        setError("Falha na gravação.");
        setRecorderState("error");
        pendingBlobRef.current = null;
        resetSession();
        stopResolverRef.current?.(null);
        stopResolverRef.current = null;
      };

      recorder.onstop = () => {
        clearTimers();
        const type = recorder.mimeType || mime || "audio/webm";
        const blob =
          chunksRef.current.length > 0
            ? new Blob(chunksRef.current, { type })
            : null;
        releaseStream();
        mediaRecorderRef.current = null;
        chunksRef.current = [];
        pendingBlobRef.current = blob;
        setElapsedMs(0);
        if (stateRef.current !== "error") {
          setRecorderState("idle");
        }
        const resolve = stopResolverRef.current;
        stopResolverRef.current = null;
        resolve?.(blob);
      };

      startedAtRef.current = Date.now();
      setElapsedMs(0);
      tickRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startedAtRef.current);
      }, 200);

      maxTimerRef.current = setTimeout(() => {
        const rec = mediaRecorderRef.current;
        if (rec?.state === "recording") {
          try {
            rec.requestData?.();
            rec.stop();
          } catch {
            /* noop */
          }
        }
      }, MAX_RECORDING_MS);

      recorder.start(250);
      setRecorderState("recording");
    } catch {
      resetSession();
      pendingBlobRef.current = null;
      setError("Permissão de microfone negada ou indisponível.");
      setRecorderState("error");
    }
  }, [resetSession, clearTimers, releaseStream, setRecorderState]);

  const stop = useCallback(async () => {
    const recorder = mediaRecorderRef.current;

    // Auto-stop (ou stop já concluído): devolve blob pendente e libera refs.
    if (!recorder || recorder.state === "inactive") {
      const pending = pendingBlobRef.current;
      pendingBlobRef.current = null;
      resetSession();
      setRecorderState("idle");
      return pending;
    }

    const elapsed = Date.now() - startedAtRef.current;
    if (elapsed < MIN_RECORDING_MS) {
      setRecorderState("stopping");
      const shortPromise = new Promise<Blob | null>((resolve) => {
        stopResolverRef.current = resolve;
      });
      try {
        recorder.stop();
      } catch {
        stopResolverRef.current?.(null);
        stopResolverRef.current = null;
      }
      await shortPromise;
      pendingBlobRef.current = null;
      resetSession();
      setRecorderState("idle");
      setError("Gravação muito curta.");
      return null;
    }

    setRecorderState("stopping");
    const blobPromise = new Promise<Blob | null>((resolve) => {
      stopResolverRef.current = resolve;
    });

    try {
      recorder.requestData?.();
      recorder.stop();
    } catch {
      stopResolverRef.current?.(null);
      stopResolverRef.current = null;
      pendingBlobRef.current = null;
      resetSession();
      setRecorderState("error");
      setError("Não consegui finalizar a gravação.");
      return null;
    }

    const blob = await blobPromise;
    pendingBlobRef.current = null;
    setRecorderState("idle");
    setElapsedMs(0);
    return blob;
  }, [resetSession, setRecorderState]);

  const cancel = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    stopResolverRef.current = () => {
      /* discard */
    };
    try {
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
    } catch {
      /* noop */
    }
    stopResolverRef.current = null;
    pendingBlobRef.current = null;
    resetSession();
    setError(null);
    setRecorderState("idle");
  }, [resetSession, setRecorderState]);

  return {
    state,
    error,
    elapsedMs,
    mimeType,
    start,
    stop,
    cancel,
    clearError: () => {
      setError(null);
      if (stateRef.current === "error") setRecorderState("idle");
    },
  };
}
