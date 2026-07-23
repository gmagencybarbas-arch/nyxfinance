"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarRange,
  ArrowLeftRight,
  Repeat,
  X,
  ChevronRight,
} from "lucide-react";
import { useAssistantOptional } from "@/contexts/AssistantContext";
import { useRecurringBillsUIOptional } from "@/contexts/RecurringBillsUIContext";

const TRANSITION_MS = 280;

const MENU_LINES: Record<string, string> = {
  nyx: "Escolhe logo antes que eu escolha por vc.",
  eva: "Pra onde a gente vai agora?",
  pip: "Bora, tem coisa pra mexer aqui.",
};

type MenuItem =
  | {
      id: string;
      title: string;
      description: string;
      icon: typeof LayoutDashboard;
      href: string;
    }
  | {
      id: string;
      title: string;
      description: string;
      icon: typeof Repeat;
      action: "recurring";
    };

const MENU_ITEMS: MenuItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    description: "O resumo da sua vida financeira.",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    id: "planejamento",
    title: "Planejamento",
    description: "Veja como os próximos meses estão ficando.",
    icon: CalendarRange,
    href: "/planejamento",
  },
  {
    id: "transactions",
    title: "Transações",
    description: "Tudo que entrou e saiu.",
    icon: ArrowLeftRight,
    href: "/transactions",
  },
  {
    id: "recurring",
    title: "Despesas recorrentes",
    description: "Contas fixas, assinaturas e cobranças automáticas.",
    icon: Repeat,
    action: "recurring",
  },
];

type CloseOptions = {
  fromPopstate?: boolean;
  skipHistory?: boolean;
};

type MobileMenuOverlayProps = {
  open: boolean;
  onClose: (options?: CloseOptions) => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
};

export function MobileMenuOverlay({
  open,
  onClose,
  returnFocusRef,
}: MobileMenuOverlayProps) {
  const router = useRouter();
  const assistant = useAssistantOptional();
  const recurringUI = useRecurringBillsUIOptional();
  const titleId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hadOpenRef = useRef(false);

  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setVisible(true);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
      return () => cancelAnimationFrame(id);
    }
    setEntered(false);
    const t = window.setTimeout(() => setVisible(false), TRANSITION_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (open) hadOpenRef.current = true;
    if (open || visible) return;
    if (!hadOpenRef.current) return;
    returnFocusRef.current?.focus();
  }, [open, visible, returnFocusRef]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focusables.length === 0) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    panel.addEventListener("keydown", onKeyDown);
    return () => panel.removeEventListener("keydown", onKeyDown);
  }, [open, visible, entered]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const onPopState = () => onClose({ fromPopstate: true });
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [open, onClose]);

  const characterSlug =
    assistant?.selectedCharacterConfig?.slug ??
    assistant?.selectedCharacter?.slug ??
    "nyx";
  const line = MENU_LINES[characterSlug] ?? MENU_LINES.nyx;
  const characterName =
    assistant?.selectedCharacterConfig?.name ??
    assistant?.selectedCharacter?.name ??
    "Nyx";
  const characterSrc =
    assistant?.activeAssets.master ||
    assistant?.resolveVisualSrc("master") ||
    "";

  const handleNavigate = useCallback(
    (href: string) => {
      onClose({ skipHistory: true });
      router.push(href);
    },
    [onClose, router]
  );

  const handleRecurring = useCallback(() => {
    onClose({ skipHistory: true });
    window.setTimeout(() => {
      recurringUI?.openRecurringBills();
    }, 40);
  }, [onClose, recurringUI]);

  if (!mounted || !visible) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] box-border h-[100dvh] w-full max-w-full overflow-hidden md:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Fechar menu"
        className={`absolute inset-0 bg-black/50 transition-opacity duration-[280ms] ease-out motion-reduce:transition-none ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => onClose()}
        tabIndex={-1}
      />

      <div
        ref={panelRef}
        className={`absolute inset-0 box-border flex h-full min-w-0 max-w-full flex-col overflow-hidden bg-[var(--background)] transition-transform duration-[280ms] ease-out motion-reduce:transition-none ${
          entered ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: "100%", maxWidth: "100%" }}
      >
        <header className="relative z-10 flex shrink-0 items-start justify-between gap-3 border-b border-white/[0.06] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="min-w-0 flex-1">
            <h2
              id={titleId}
              className="text-xl font-semibold tracking-tight text-[var(--foreground)]"
            >
              Menu
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              <span className="text-[var(--nyx-gradient-start)]">{characterName}</span>
              {": "}
              {line}
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            aria-label="Fechar menu"
            onClick={() => onClose()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[var(--background-secondary)] text-[var(--foreground)] active:scale-95"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </header>

        <div className="relative z-10 min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <nav
            aria-label="Áreas do app"
            className="relative z-10 flex min-w-0 flex-col gap-2"
          >
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if ("action" in item) handleRecurring();
                    else handleNavigate(item.href);
                  }}
                  className="flex min-h-[52px] w-full min-w-0 max-w-full items-center gap-3 rounded-2xl border border-white/[0.06] bg-[var(--background-secondary)]/80 px-3 py-3 text-left transition-colors active:scale-[0.99] active:bg-white/[0.06]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--muted)] text-[var(--nyx-gradient-start)]">
                    <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium text-[var(--foreground)]">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-[var(--muted-foreground)]">
                      {item.description}
                    </span>
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]"
                    aria-hidden
                  />
                </button>
              );
            })}
          </nav>
        </div>

        {characterSrc ? (
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 right-0 z-0 hidden max-h-[30dvh] w-[42%] max-w-[180px] overflow-hidden opacity-40 min-[390px]:block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={characterSrc}
              alt=""
              className="h-auto w-full translate-x-[12%] translate-y-[18%] object-contain object-bottom"
              draggable={false}
            />
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
