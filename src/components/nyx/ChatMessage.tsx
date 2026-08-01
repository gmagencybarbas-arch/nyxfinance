"use client";

import { motion } from "framer-motion";
import { Paperclip } from "lucide-react";
import type { ChatMessageType } from "./types";
import { NyxRichText } from "./NyxRichText";

interface ChatMessageProps {
  message: ChatMessageType;
  index: number;
}

function isImageType(type?: string) {
  return type?.startsWith("image/");
}

export function ChatMessage({ message, index }: ChatMessageProps) {
  const isUser = message.role === "user";
  const attachment = message.attachment;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      <motion.div
        className={`rounded-2xl px-4 py-3 ${
          isUser
            ? "max-w-[58%] bg-[var(--muted)] text-[var(--foreground)] rounded-br-md"
            : "max-w-[68%] bg-gradient-to-br from-violet-500/15 to-emerald-500/12 border border-violet-500/25 text-[var(--foreground)] rounded-bl-md shadow-[0_0_18px_rgba(167,139,250,0.12)]"
        }`}
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {!isUser && (
          <span className="text-xs font-medium text-purple-400 opacity-80 mb-1 block">
            Nyx
          </span>
        )}
        {isUser && message.fromAudio ? (
          <span className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-emerald-400/80">
            Áudio
          </span>
        ) : null}
        {(message.content || attachment) && (
          <>
            {message.content ? (
              <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                {isUser ? (
                  message.content
                ) : (
                  <NyxRichText text={message.content} />
                )}
              </p>
            ) : null}
            {attachment && (
              <div className="mt-2 rounded-xl overflow-hidden border border-[var(--border)]/50">
                {isImageType(attachment.type) ? (
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="max-w-full max-h-48 object-contain"
                    />
                  </a>
                ) : (
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)]/50"
                  >
                    <Paperclip className="w-4 h-4 shrink-0" />
                    <span className="truncate">{attachment.name}</span>
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
