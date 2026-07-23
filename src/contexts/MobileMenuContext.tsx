"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { MobileMenuOverlay } from "@/components/navigation/MobileMenuOverlay";

type CloseMenuOptions = {
  fromPopstate?: boolean;
  /** Fecha sem history.back() (navegação / abrir outro overlay). */
  skipHistory?: boolean;
};

type MobileMenuContextValue = {
  isOpen: boolean;
  openMenu: () => void;
  closeMenu: (options?: CloseMenuOptions) => void;
  toggleMenu: () => void;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
};

const MobileMenuContext = createContext<MobileMenuContextValue | null>(null);

export const MOBILE_MENU_HISTORY_KEY = "nyxMobileMenu";

export function MobileMenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const openedWithHistoryRef = useRef(false);

  const closeMenu = useCallback((options?: CloseMenuOptions) => {
    setIsOpen(false);

    if (typeof window === "undefined") {
      openedWithHistoryRef.current = false;
      return;
    }

    if (options?.fromPopstate) {
      openedWithHistoryRef.current = false;
      return;
    }

    const hasMenuState = Boolean(window.history.state?.[MOBILE_MENU_HISTORY_KEY]);

    if (options?.skipHistory || !openedWithHistoryRef.current || !hasMenuState) {
      if (hasMenuState) {
        const state = { ...(window.history.state as Record<string, unknown>) };
        delete state[MOBILE_MENU_HISTORY_KEY];
        window.history.replaceState(
          Object.keys(state).length > 0 ? state : null,
          ""
        );
      }
      openedWithHistoryRef.current = false;
      return;
    }

    openedWithHistoryRef.current = false;
    window.history.back();
  }, []);

  const openMenu = useCallback(() => {
    setIsOpen(true);
    if (typeof window === "undefined") return;
    if (!window.history.state?.[MOBILE_MENU_HISTORY_KEY]) {
      window.history.pushState({ [MOBILE_MENU_HISTORY_KEY]: true }, "");
      openedWithHistoryRef.current = true;
    }
  }, []);

  const toggleMenu = useCallback(() => {
    if (isOpen) closeMenu();
    else openMenu();
  }, [isOpen, openMenu, closeMenu]);

  const value = useMemo(
    () => ({
      isOpen,
      openMenu,
      closeMenu,
      toggleMenu,
      menuButtonRef,
    }),
    [isOpen, openMenu, closeMenu, toggleMenu]
  );

  return (
    <MobileMenuContext.Provider value={value}>
      {children}
      <MobileMenuOverlay
        open={isOpen}
        onClose={closeMenu}
        returnFocusRef={menuButtonRef}
      />
    </MobileMenuContext.Provider>
  );
}

export function useMobileMenu() {
  const ctx = useContext(MobileMenuContext);
  if (!ctx) {
    throw new Error("useMobileMenu must be used within MobileMenuProvider");
  }
  return ctx;
}

export function useMobileMenuOptional() {
  return useContext(MobileMenuContext);
}
