"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { AddEntryModal } from "./AddEntryModal";

interface AddEntryButtonProps {
  onSaved: () => void;
  className?: string;
  label?: string;
  successMessage?: string;
}

export function AddEntryButton({
  onSaved,
  className = "",
  label = "Adicionar",
  successMessage = "Lançamento salvo. Planejamento atualizado.",
}: AddEntryButtonProps) {
  const [open, setOpen] = useState(false);
  const toast = useToast();

  const handleSaved = useCallback(() => {
    onSaved();
    toast.show(successMessage, "success");
  }, [onSaved, toast, successMessage]);

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(167,139,250,0.3)] transition hover:opacity-95 ${className}`}
        whileTap={{ scale: 0.97 }}
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        {label}
      </motion.button>

      <AddEntryModal open={open} onClose={() => setOpen(false)} onSaved={handleSaved} />
    </>
  );
}
