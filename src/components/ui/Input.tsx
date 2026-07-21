"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    const hasError = Boolean(error?.trim());
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            "w-full rounded-lg border bg-[var(--input)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--background)] disabled:opacity-50 transition-colors",
            hasError
              ? "border-amber-500/70 focus:border-amber-500/70 focus:ring-amber-500/40"
              : "border-[var(--border)] focus:border-[var(--ring)] focus:ring-[var(--ring)]",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : undefined}
          {...props}
        />
        <AnimatePresence mode="wait">
          {hasError && (
            <motion.p
              id={`${inputId}-error`}
              role="alert"
              className="mt-1.5 text-sm text-amber-400/90"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = "Input";
