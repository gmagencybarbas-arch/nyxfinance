"use client";

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import type { ChatMessageType } from "./types";

const EMPTY_SHORTCUTS = [
  "café 15 hoje",
  "recebi 3500",
  "notebook 10x de 350",
  "aluguel todo dia 5",
] as const;

const NEAR_BOTTOM_PX = 64;

interface NyxChatProps {
  messages: ChatMessageType[];
  isThinking?: boolean;
  className?: string;
  onScrollOffset?: (offset: number) => void;
  /** Empty state: preenche input sem enviar. */
  onShortcutSelect?: (text: string) => void;
  /** Conteúdo após as mensagens, dentro da mesma área de scroll (ex.: review). */
  scrollFooter?: ReactNode;
}

function distanceFromBottom(el: HTMLElement) {
  return el.scrollHeight - el.scrollTop - el.clientHeight;
}

export function NyxChat({
  messages,
  isThinking,
  className = "",
  onScrollOffset,
  onShortcutSelect,
  scrollFooter,
}: NyxChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasNewBelow, setHasNewBelow] = useState(false);
  const isEmpty = messages.length === 0 && !isThinking && !scrollFooter;

  const refreshNewIndicator = useCallback(() => {
    const el = scrollRef.current;
    if (!el || isEmpty) {
      setHasNewBelow(false);
      return;
    }
    setHasNewBelow(distanceFromBottom(el) > NEAR_BOTTOM_PX);
  }, [isEmpty]);

  // Nunca força scroll. Só detecta se há conteúdo novo fora da viewport.
  useEffect(() => {
    if (isEmpty) {
      setHasNewBelow(false);
      return;
    }
    const id = requestAnimationFrame(() => refreshNewIndicator());
    return () => cancelAnimationFrame(id);
  }, [messages, isThinking, scrollFooter, isEmpty, refreshNewIndicator]);

  const scrollToLatest = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    setHasNewBelow(false);
  }, []);

  return (
    <div className={`relative flex h-full min-h-0 flex-col ${className}`}>
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const top = e.currentTarget.scrollTop;
          onScrollOffset?.(top);
          if (distanceFromBottom(e.currentTarget) <= NEAR_BOTTOM_PX) {
            setHasNewBelow(false);
          }
        }}
        className="h-full min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{ scrollbarWidth: "thin" }}
      >
        {isEmpty ? (
          <div className="px-4 pb-4 pt-5">
            <div className="mx-auto w-full max-w-md text-center">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-violet-300/70">
                Nyx
              </p>
              <p className="text-balance text-base font-medium leading-snug text-[var(--foreground)] sm:text-lg">
                Me conta o que aconteceu.
                <br />
                <span className="text-[var(--muted-foreground)]">Eu organizo o resto.</span>
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {EMPTY_SHORTCUTS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => onShortcutSelect?.(label)}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-left text-[13px] text-white/70 transition hover:border-violet-400/35 hover:bg-violet-500/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-[40rem] flex-col gap-3.5 px-3 pb-4 pt-3 md:px-5 md:py-5">
            <AnimatePresence mode="popLayout">
              {messages.map((msg, i) => (
                <ChatMessage key={msg.id} message={msg} index={i} />
              ))}
              {isThinking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-start"
                >
                  <motion.div
                    className="flex gap-1.5 rounded-2xl rounded-bl-md border border-[var(--border)] bg-[var(--muted)]/60 px-4 py-3"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    <span className="h-2 w-2 rounded-full bg-[var(--nyx-gradient-start)]" />
                    <span className="h-2 w-2 rounded-full bg-[var(--nyx-gradient-mid)]" />
                    <span className="h-2 w-2 rounded-full bg-[var(--nyx-gradient-end)]" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            {scrollFooter ? <div className="pb-2 pt-1">{scrollFooter}</div> : null}
          </div>
        )}
      </div>

      <AnimatePresence>
        {hasNewBelow ? (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            onClick={scrollToLatest}
            className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/15 bg-[var(--background-secondary)]/95 px-3.5 py-2 text-xs font-medium text-[var(--foreground)] shadow-lg backdrop-blur-md"
            aria-label="Ir para novas mensagens"
          >
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            Novas mensagens
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
