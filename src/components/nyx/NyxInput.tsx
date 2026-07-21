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
import { Paperclip, X, Mic, Send } from "lucide-react";
import { playRecordingStartBeep, playRecordingStopBeep } from "@/lib/sounds/recordingBeep";

export interface NyxInputHandle {
  focus: () => void;
  setValue: (text: string) => void;
}

interface NyxInputProps {
  onSend: (text: string, file?: File) => void;
  onMicToggle: () => void;
  isListening: boolean;
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

export const NyxInput = forwardRef<NyxInputHandle, NyxInputProps>(function NyxInput(
  {
    onSend,
    onMicToggle,
    isListening,
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

  const micBlocked = disabled || chatLocked || descriptionTypingOnly;
  const fileBlocked = disabled || chatLocked || descriptionTypingOnly;
  const fieldLocked = disabled || chatLocked;
  const large = size === "large";

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
    if (micBlocked) return;
    if (isListening) playRecordingStopBeep();
    else playRecordingStartBeep();
    onMicToggle();
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
    !((!text.trim() && !selectedFile) || (descriptionTypingOnly && !text.trim()));

  const lockHint = chatLocked
    ? "Escolha Não ou Sim acima para continuar"
    : descriptionTypingOnly
      ? "Digite a observação abaixo"
      : isListening
        ? "Ouvindo…"
        : null;

  const statusLine = lockHint ?? companionHint;

  return (
    <div
      className={`mx-auto w-full ${
        large ? "max-w-none px-3 md:w-[92%] md:px-0" : "px-3 md:max-w-xl md:px-4"
      }`}
    >
      {statusLine && (
        <p className="mb-2 text-center text-[11px] tracking-wide text-[var(--muted-foreground)]">
          {statusLine}
        </p>
      )}

      {selectedFile && (
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
            isListening
              ? "bg-emerald-500/20 text-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.35)]"
              : large
                ? "bg-white/[0.06] text-violet-200/90 hover:bg-violet-500/15 hover:text-violet-100"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
          whileTap={{ scale: 0.92 }}
          animate={
            isListening
              ? {
                  boxShadow: [
                    "0 0 0 rgba(52,211,153,0)",
                    "0 0 18px rgba(52,211,153,0.45)",
                    "0 0 0 rgba(52,211,153,0)",
                  ],
                }
              : {}
          }
          transition={{ duration: 0.8, repeat: isListening ? Infinity : 0 }}
          aria-label={isListening ? "Parar de ouvir" : "Falar com Nyx"}
        >
          <Mic className={large ? "h-5 w-5" : "h-5 w-5"} />
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
    </div>
  );
});
