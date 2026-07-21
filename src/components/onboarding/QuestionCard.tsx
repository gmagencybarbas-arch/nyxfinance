"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";

interface QuestionCardProps {
  children: ReactNode;
  className?: string;
}

export function QuestionCard({ children, className = "" }: QuestionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`w-full ${className}`}
    >
      {children}
    </motion.div>
  );
}
