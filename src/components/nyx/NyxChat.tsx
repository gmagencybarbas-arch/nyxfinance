"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "./ChatMessage";
import type { ChatMessageType } from "./types";

const EMPTY_SHORTCUTS = [
  "café 15 hoje",
  "recebi 3500",
  "notebook 10x de 350",
  "aluguel todo dia 5",
] as const;

interface NyxChatProps {
  messages: ChatMessageType[];
  isThinking?: boolean;
  className?: string;
  onScrollOffset?: (offset: number) => void;
  /** Empty state: preenche input sem enviar. */
  onShortcutSelect?: (text: string) => void;
}

export function NyxChat({
  messages,
  isThinking,
  className = "",
  onScrollOffset,
  onShortcutSelect,
}: NyxChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isEmpty = messages.length === 0 && !isThinking;

  useEffect(() => {
    if (isEmpty) return;
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isThinking, isEmpty]);

  return (
    <div
      ref={scrollRef}
      onScroll={(e) => {
        onScrollOffset?.(e.currentTarget.scrollTop);
      }}
      className={`flex flex-col overflow-y-auto overflow-x-hidden scroll-smooth ${className}`}
      style={{ scrollbarWidth: "thin" }}
    >
      {isEmpty ? (
        <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-10">
          <div className="w-full max-w-md text-center">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-violet-300/70">
              Nyx
            </p>
            <p className="text-balance text-lg font-medium leading-snug text-[var(--foreground)] sm:text-xl">
              Me conta o que aconteceu.
              <br />
              <span className="text-[var(--muted-foreground)]">Eu organizo o resto.</span>
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
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
        <div className="mx-auto flex w-full max-w-[40rem] flex-col gap-3.5 px-3 pt-[25px] pb-4 md:px-5 md:py-5">
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
        </div>
      )}
    </div>
  );
}
