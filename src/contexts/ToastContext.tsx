"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

export type ToastType = "success" | "error" | "info" | "default";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  createdAt: number;
}

type ToastContextValue = {
  toasts: ToastItem[];
  show: (message: string, type?: ToastType) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;

function ToastList({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  return (
    <div
      className="fixed top-4 left-4 right-4 z-[100] mx-auto flex max-w-md flex-col gap-2 sm:left-auto sm:right-6 sm:top-6"
      role="region"
      aria-label="Notificações"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="rounded-xl border border-white/[0.08] bg-[var(--card)]/90 px-4 py-3 shadow-lg backdrop-blur-xl"
            style={{
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.4), 0 0 40px rgba(167,139,250,0.08)",
            }}
          >
            <p className="text-sm font-medium text-[var(--foreground)]">{t.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="absolute right-2 top-2 rounded p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              aria-label="Fechar"
            >
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: string) => {
    const t = timersRef.current.get(id);
    if (t) clearTimeout(t);
    timersRef.current.delete(id);
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const show = useCallback(
    (message: string, type: ToastType = "default") => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const item: ToastItem = { id, message, type, createdAt: Date.now() };
      setToasts((prev) => [...prev, item]);

      const timer = setTimeout(() => {
        dismiss(id);
      }, AUTO_DISMISS_MS);
      timersRef.current.set(id, timer);
    },
    [dismiss]
  );

  useEffect(() => () => timersRef.current.forEach((t) => clearTimeout(t)), []);

  const value: ToastContextValue = { toasts, show, dismiss };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <ToastList toasts={toasts} onDismiss={dismiss} />,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
