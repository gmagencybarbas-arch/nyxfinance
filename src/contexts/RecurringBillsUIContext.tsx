"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { EditRecurringBillsModal } from "@/components/planning/EditRecurringBillsModal";

type RecurringBillsUIContextValue = {
  isOpen: boolean;
  openRecurringBills: () => void;
  closeRecurringBills: () => void;
};

const RecurringBillsUIContext =
  createContext<RecurringBillsUIContextValue | null>(null);

export function RecurringBillsUIProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openRecurringBills = useCallback(() => setIsOpen(true), []);
  const closeRecurringBills = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ isOpen, openRecurringBills, closeRecurringBills }),
    [isOpen, openRecurringBills, closeRecurringBills]
  );

  return (
    <RecurringBillsUIContext.Provider value={value}>
      {children}
      <EditRecurringBillsModal open={isOpen} onClose={closeRecurringBills} />
    </RecurringBillsUIContext.Provider>
  );
}

export function useRecurringBillsUI() {
  const ctx = useContext(RecurringBillsUIContext);
  if (!ctx) {
    throw new Error("useRecurringBillsUI must be used within RecurringBillsUIProvider");
  }
  return ctx;
}

export function useRecurringBillsUIOptional() {
  return useContext(RecurringBillsUIContext);
}
