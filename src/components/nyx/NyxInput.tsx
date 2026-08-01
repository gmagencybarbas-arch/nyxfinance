"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { motion } from "framer-motion";
import { Paperclip, X, Mic, Send, Square, Check } from "lucide-react";
import { playRecordingStartBeep, playRecordingStopBeep } from "@/lib/sounds/recordingBeep";
import type { VoiceUiPhase } from "@/lib/audio/constants";

export interface NyxInputHandle {
  focus: () => void;
  setValue: (text: string) => void;
}

interface NyxInputProps {
  onSend: (text: string, file?: File) => void;
  /** Inicia gravação (idle → recording). */
  onMicStart: () => void;
  /** Cancela gravação em andamento. */
  onVoiceCancel: () => void;
  /** Finaliza gravação e envia para transcrição. */
  onVoiceSend: () => void;
  voicePhase: VoiceUiPhase;
  voiceElapsedMs: number;
  voiceError?: string | null;
  disabled?: boolean;
  /** Trava texto, mic e anexo (ex.: escolher Não/Sim só por botões no chat). */
  chatLocked?: boolean;
  /** Após “Sim”: só mensagem de texto; mic e anexo desligados. */
  descriptionTypingOnly?: boolean;
  /** Dispara quando o usuário começa/para de digitar (para sprite typing/master). */
  onTypingChange?: (typing: boolean) => void;
  /** Hint abaixo do composer (acompanhando / pensando). */
  companionHint?: string | null;
  /** Variante visual do composer. */
  size?: "default" | "large";
}

const ACCEPT_TYPES = "image/*,application/pdf";

function formatElapsed(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function voiceStatusLabel(phase: VoiceUiPhase, error?: string | null): string | null {
  switch (phase) {
    case "requesting_permission":
      return "Pedindo permissão do microfone…";
    case "recording":
      return "Gravando… Toque em ✓ para enviar ou X para cancelar";
    case "uploading":
      return "Enviando áudio…";
    case "transcribing":
      return "Transcrevendo…";
    case "interpreting":
      return "Interpretando…";
    case "error":
      return error || "Erro no áudio";
    default:
      return null;
  }
}

export const NyxInput = forwardRef<NyxInputHandle, NyxInputProps>(function NyxInput(
  {
    onSend,
    onMicStart,
    onVoiceCancel,
    onVoiceSend,
    voicePhase,
    voiceElapsedMs,
    voiceError = null,
    disabled = false,
    chatLocked = false,
    descriptionTypingOnly = false,
    onTypingChange,
    companionHint = null,
    size = "default",
  },
  ref
) {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const voiceBusy =
    voicePhase === "requesting_permission" ||
    voicePhase === "recording" ||
    voicePhase === "uploading" ||
    voicePhase === "transcribing" ||
    voicePhase === "interpreting";

  const micBlocked = disabled || chatLocked || descriptionTypingOnly || voiceBusy;
  const fileBlocked = disabled || chatLocked || descriptionTypingOnly || voiceBusy;
  const fieldLocked = disabled || chatLocked || voiceBusy;
  const large = size === "large";
  const isRecording = voicePhase === "recording";

  const focusInput = useCallback(() => {
    const el = inputRef.current;
    if (!el || fieldLocked) return;
    requestAnimationFrame(() => {
      el.focus({ preventScroll: true });
    });
  }, [fieldLocked]);

  const setValue = useCallback(
    (next: string) => {
      setText(next);
      onTypingChange?.(next.length > 0);
      requestAnimationFrame(() => focusInput());
    },
    [onTypingChange, focusInput]
  );

  useImperativeHandle(ref, () => ({ focus: focusInput, setValue }), [focusInput, setValue]);

  useEffect(() => {
    if (fieldLocked) return;
    const t = window.setTimeout(focusInput, 80);
    return () => clearTimeout(t);
  }, [fieldLocked, disabled, chatLocked, descriptionTypingOnly, focusInput]);

  useEffect(() => {
    focusInput();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- foco inicial ao abrir /nyx
  }, []);

  const handleMicClick = () => {
    if (micBlocked && !isRecording) return;
    if (isRecording) return;
    playRecordingStartBeep();
    onMicStart();
  };

  const handleVoiceCancelClick = () => {
    playRecordingStopBeep();
    onVoiceCancel();
  };

  const handleVoiceSendClick = () => {
    playRecordingStopBeep();
    onVoiceSend();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type.startsWith("image/") || file.type === "application/pdf")) {
      setSelectedFile(file);
    }
    e.target.value = "";
  };

  const clearFile = () => setSelectedFile(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (voiceBusy) return;
    const trimmed = text.trim();
    if (fieldLocked) return;
    if (descriptionTypingOnly && selectedFile) return;
    if ((trimmed || selectedFile) && !disabled) {
      onSend(trimmed || "(anexo)", selectedFile ?? undefined);
      setText("");
      setSelectedFile(null);
      onTypingChange?.(false);
      focusInput();
    }
  };

  const canSend =
    !fieldLocked &&
    !voiceBusy &&
    !((!text.trim() && !selectedFile) || (descriptionTypingOnly && !text.trim()));

  const lockHint = chatLocked
    ? "Escolha Não ou Sim acima para continuar"
    : descriptionTypingOnly
      ? "Digite a observação abaixo"
      : voiceStatusLabel(voicePhase, voiceError);

  const statusLine = lockHint ?? companionHint;

  return (
    <div
      className={`mx-auto w-full ${
        large ? "max-w-none px-3 md:w-[92%] md:px-0" : "px-3 md:max-w-xl md:px-4"
      }`}
    >
      {statusLine && (
        <p
          className={`mb-2 text-center text-[11px] tracking-wide ${
            voicePhase === "error"
              ? "text-rose-400"
              : "text-[var(--muted-foreground)]"
          }`}
        >
          {statusLine}
        </p>
      )}

      {selectedFile && !voiceBusy && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--muted)]/60 px-3 py-2"
        >
          <span className="flex-1 truncate text-sm text-[var(--foreground)]">
            {selectedFile.name}
          </span>
          <button
            type="button"
            onClick={clearFile}
            className="rounded-full p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            aria-label="Remover arquivo"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      {isRecording ||
      voicePhase === "uploading" ||
      voicePhase === "transcribing" ||
      voicePhase === "requesting_permission" ? (
        <div
          className={`flex items-center gap-2 border border-emerald-400/30 bg-[var(--card)]/70 shadow-[0_0_32px_rgba(52,211,153,0.12)] backdrop-blur-xl ${
            large
              ? "min-h-[56px] rounded-[1.35rem] px-2 py-1.5 md:min-h-[60px] md:rounded-[1.5rem]"
              : "rounded-[1.75rem] p-1.5"
          }`}
          role="status"
          aria-live="polite"
        >
          <motion.div
            className={`flex shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 ${
              large ? "h-12 w-12" : "h-11 w-11"
            }`}
            animate={
              isRecording
                ? {
                    boxShadow: [
                      "0 0 0 rgba(244,63,94,0)",
                      "0 0 18px rgba(244,63,94,0.45)",
                      "0 0 0 rgba(244,63,94,0)",
                    ],
                  }
                : {}
            }
            transition={{ duration: 0.9, repeat: isRecording ? Infinity : 0 }}
          >
            {isRecording ? (
              <Square className="h-4 w-4 fill-current" aria-hidden />
            ) : (
              <Mic className="h-5 w-5" aria-hidden />
            )}
          </motion.div>

          <div className="min-w-0 flex-1 px-1">
            <p className="text-sm font-medium tabular-nums text-[var(--foreground)]">
              {isRecording
                ? formatElapsed(voiceElapsedMs)
                : voicePhase === "transcribing"
                  ? "Transcrevendo…"
                  : voicePhase === "uploading"
                    ? "Enviando…"
                    : "Preparando…"}
            </p>
          </div>

          {isRecording ? (
            <>
              <motion.button
                type="button"
                onClick={handleVoiceCancelClick}
                className={`flex shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[var(--muted-foreground)] hover:text-rose-300 ${
                  large ? "h-11 w-11" : "h-11 w-11"
                }`}
                whileTap={{ scale: 0.92 }}
                aria-label="Cancelar gravação"
              >
                <X className="h-5 w-5" />
              </motion.button>
              <motion.button
                type="button"
                onClick={handleVoiceSendClick}
                className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-[0_0_16px_rgba(52,211,153,0.35)] ${
                  large ? "h-11 w-11 md:h-12 md:w-12" : "h-11 w-11"
                }`}
                whileTap={{ scale: 0.92 }}
                aria-label="Enviar áudio"
              >
                <Check className="h-5 w-5" strokeWidth={2.5} />
              </motion.button>
            </>
          ) : null}
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className={`flex items-center gap-2 border border-white/10 bg-[var(--card)]/55 shadow-[0_0_32px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-[box-shadow,border-color] ${
            large
              ? "min-h-[56px] rounded-[1.35rem] px-2 py-1.5 md:min-h-[60px] md:rounded-[1.5rem] md:px-2.5"
              : "rounded-[1.75rem] p-1.5"
          } ${
            focused
              ? "border-violet-400/40 shadow-[0_0_0_1px_rgba(167,139,250,0.25),0_0_28px_rgba(139,92,246,0.22)]"
              : ""
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT_TYPES}
            onChange={handleFileChange}
            className="hidden"
          />

          <motion.button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={fileBlocked}
            className={`flex shrink-0 items-center justify-center rounded-full text-[var(--muted-foreground)] transition hover:text-[var(--foreground)] disabled:opacity-40 ${
              large ? "h-10 w-10" : "h-11 w-11"
            }`}
            whileTap={{ scale: 0.94 }}
            aria-label="Anexar arquivo"
          >
            <Paperclip className={large ? "h-[18px] w-[18px]" : "h-5 w-5"} />
          </motion.button>

          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => {
              const next = e.target.value;
              setText(next);
              onTypingChange?.(next.length > 0);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={
              descriptionTypingOnly
                ? "Detalhes ou observação…"
                : "Fale ou escreva para a Nyx…"
            }
            disabled={fieldLocked}
            className={`min-w-0 flex-1 bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/70 focus:outline-none disabled:opacity-50 ${
              large ? "min-h-11 py-3 text-[15px] md:text-base" : "min-h-11 py-2.5 text-[15px]"
            }`}
          />

          <motion.button
            type="button"
            onClick={handleMicClick}
            disabled={micBlocked}
            className={`flex shrink-0 items-center justify-center rounded-full transition disabled:opacity-40 ${
              large ? "h-12 w-12" : "h-11 w-11"
            } ${
              large
                ? "bg-white/[0.06] text-violet-200/90 hover:bg-violet-500/15 hover:text-violet-100"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
            whileTap={{ scale: 0.92 }}
            aria-label="Gravar mensagem de voz"
          >
            <Mic className="h-5 w-5" />
          </motion.button>

          <motion.button
            type="submit"
            disabled={!canSend}
            className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)] text-white shadow-[0_0_16px_rgba(167,139,250,0.35)] disabled:opacity-40 disabled:shadow-none ${
              large ? "h-11 w-11 md:h-12 md:w-12" : "h-11 w-11"
            }`}
            whileTap={{ scale: 0.92 }}
            aria-label="Enviar"
          >
            <Send className="h-4 w-4 translate-x-[1px]" />
          </motion.button>
        </form>
      )}
    </div>
  );
});
