"use client";

import { memo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { ExpenseCategory } from "./types";
import { PRESET_COLORS } from "./constants/categories";

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Omit<ExpenseCategory, "id">) => void;
}

function AddCategoryModalBase({ isOpen, onClose, onSave }: AddCategoryModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0] ?? "#a78bfa");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = name.trim();
      if (!trimmed) return;
      onSave({ name: trimmed, description: description.trim() || undefined, color });
      setName("");
      setDescription("");
      setColor(PRESET_COLORS[0] ?? "#a78bfa");
      onClose();
    },
    [name, description, color, onSave, onClose]
  );

  const handleClose = useCallback(() => {
    setName("");
    setDescription("");
    setColor(PRESET_COLORS[0] ?? "#a78bfa");
    onClose();
  }, [onClose]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-category-title"
            className="fixed left-1/2 top-1/2 z-[101] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xl"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 id="add-category-title" className="text-lg font-semibold text-[var(--foreground)]">
                Adicionar categoria
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="cat-name" className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                  Nome
                </label>
                <input
                  id="cat-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Assinaturas"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="cat-desc" className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                  Descrição (opcional)
                </label>
                <input
                  id="cat-desc"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Netflix, Spotify..."
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none"
                />
              </div>
              <div>
                <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  Cor (barra de progresso)
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        color === c ? "border-[var(--foreground)] scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                      aria-label={`Cor ${c}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[var(--muted)] text-[var(--foreground)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[var(--nyx-gradient-start)] text-white disabled:opacity-50"
                >
                  Salvar
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}

export const AddCategoryModal = memo(AddCategoryModalBase);
