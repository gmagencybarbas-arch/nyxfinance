"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useNyxVisualState } from "@/hooks/useNyxVisualState";
import { useNyxSounds } from "@/hooks/useNyxSounds";
import { NyxAvatarStage } from "./avatar/NyxAvatarStage";
import { NyxSoundToggle } from "./audio/NyxSoundToggle";
import { NyxChat } from "./NyxChat";
import { NyxInput, type NyxInputHandle } from "./NyxInput";
import type { NyxState, ChatMessageType, ChatAttachment } from "./types";
import { SIMULATED_RESPONSES } from "./constants";
import { playMessageSentSound } from "@/lib/sounds/chatSounds";
import type { NyxVisualState } from "./avatar/types";
import { handleNyxMessage, stripNyxDialogMeta } from "@/ai/nyxTransactionFlow";
import type { ParsedTransaction } from "@/ai/transactionParser";
import {
  formatTransactionSummaryCard,
  getInstallmentCommitmentPrompt,
  getOptionalDescriptionPrompt,
  getOptionalDescriptionTypeHint,
} from "@/ai/nyxPersonality";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from "@/components/profile/constants/categories";
import { NyxActionReview, type NyxSavedFlash } from "./review/NyxActionReview";
import {
  interpretNyxMessage as interpretNyxMessageClient,
  isLocalCancelAll,
  isLocalConfirmAll,
} from "@/lib/nyx/clientInterpret";
import { persistNyxActions } from "@/lib/nyx/persistActions";
import { mergePendingAfterConfirm } from "@/lib/nyx/normalize";
import { useAssistant } from "@/contexts/AssistantContext";
import { BottomNav } from "@/components/navigation/BottomNav";
import { NyxBootScreen } from "./NyxBootScreen";
import type { NyxPendingBatch, NyxAction } from "@/lib/nyx/types";

const TYPING_DELAY_MS_MIN = 400;
const TYPING_DELAY_MS_MAX = 900;
const SPEAKING_DURATION_MS = 2500;
const FALLBACK_RESPONSE_DELAY_MS = 1500 + Math.random() * 1000;

async function waitUntil(deadlineMs: number) {
  const remain = deadlineMs - Date.now();
  if (remain > 0) {
    await new Promise<void>((resolve) => setTimeout(resolve, remain));
  }
}

const USER_CATEGORIES = [
  ...DEFAULT_EXPENSE_CATEGORIES.map((c) => c.name),
  ...DEFAULT_INCOME_CATEGORIES.map((c) => c.name),
];

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function actionToFlash(a: NyxAction): NyxSavedFlash {
  if (a.transaction) {
    return {
      actionId: a.actionId,
      title: a.transaction.description,
      amountLabel: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(a.transaction.amount),
    };
  }
  if (a.installment) {
    return {
      actionId: a.actionId,
      title: a.installment.description,
      amountLabel: `${a.installment.totalInstallments}x de ${new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(a.installment.installmentAmount)}`,
    };
  }
  if (a.recurringBill) {
    return {
      actionId: a.actionId,
      title: a.recurringBill.title,
      amountLabel: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(a.recurringBill.amount),
    };
  }
  return { actionId: a.actionId, title: "Lançamento", amountLabel: "—" };
}

function isCigarroState(s: NyxVisualState) {
  return s === "cigarro01" || s === "cigarro02";
}

/** Repetição do áudio idle: 1ª após 2 min; depois aleatório entre 3–6 min. */
const IDLE_AUDIO_REPEAT_FIRST_MS = 120_000;
const IDLE_AUDIO_REPEAT_MIN_MS = 180_000;
const IDLE_AUDIO_REPEAT_MAX_MS = 360_000;

function stageStatusLabel(
  visual: NyxVisualState,
  opts: { hasPending: boolean; persisting: boolean; listening: boolean }
): string {
  if (visual === "sucess") return "Registrado";
  if (visual === "error") return "Erro";
  if (visual === "typing") return "Escrevendo";
  if (visual === "thinking" || opts.persisting) return "Analisando";
  if (opts.hasPending) return "Conferindo";
  if (opts.listening) return "Ouvindo";
  return "Online";
}

type OptionalDescContext = {
  transactionId: string;
  parsed: ParsedTransaction;
  awaitingDescriptionLine: boolean;
  awaitingButtonChoice: boolean;
};

type OptionalDescUi = "none" | "choose" | "typing_description";

export function NyxPage() {
  const { user } = useAuth();
  const displayName = useProfile()?.displayName;
  const isMobile = useIsMobile();
  const assistant = useAssistant();
  const [bootDone, setBootDone] = useState(false);
  const showBoot = !bootDone;
  const {
    state: visualState,
    notifyTyping,
    notifyTypingCleared,
    notifyMessageSent,
    notifyReviewReady,
    notifySuccess,
    notifyError,
    notifyInteraction,
    resetToMaster,
  } = useNyxVisualState("master");

  const {
    enabled: soundEnabled,
    setEnabled: setSoundEnabled,
    unlock: unlockSounds,
    playTyping,
    prepareThinking,
    playThinking,
    stopThinking,
    playResponse,
    playSuccess,
    playError,
    playCigarette,
    stopCigarette,
    stopAll: stopAllSounds,
  } = useNyxSounds();

  const prevVisualRef = useRef<NyxVisualState>("master");

  const [nyxState, setNyxState] = useState<NyxState>("idle");
  const [messages, setMessages] = useState<ChatMessageType[]>(() => []);
  const [isTypingDraft, setIsTypingDraft] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<ParsedTransaction | null>(null);
  const [pendingBatch, setPendingBatch] = useState<NyxPendingBatch | null>(null);
  const [failedActionIds, setFailedActionIds] = useState<Record<string, string>>({});
  const [persistingBatch, setPersistingBatch] = useState(false);
  const [persistingIds, setPersistingIds] = useState<string[]>([]);
  const [savedFlash, setSavedFlash] = useState<NyxSavedFlash[]>([]);
  const [isListening, setIsListening] = useState(false);
  const sendingRef = useRef(false);
  const nyxInputRef = useRef<NyxInputHandle>(null);
  const listeningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const optionalDescRef = useRef<OptionalDescContext | null>(null);
  const [optionalDescUi, setOptionalDescUi] = useState<OptionalDescUi>("none");
  const installmentCommitmentRef = useRef<ParsedTransaction | null>(null);
  const [showCommitmentButtons, setShowCommitmentButtons] = useState(false);

  // Mobile: documento nunca rola — só a área do chat.
  useEffect(() => {
    if (!isMobile) return;
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverscroll: body.style.overscrollBehavior,
      bodyPosition: body.style.position,
      bodyWidth: body.style.width,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      scrollY: window.scrollY,
    };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.overscrollBehavior = "none";
    body.style.position = "fixed";
    body.style.width = "100%";
    body.style.left = "0";
    body.style.right = "0";
    body.style.top = `-${prev.scrollY}px`;
    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      html.style.overscrollBehavior = prev.htmlOverscroll;
      body.style.overscrollBehavior = prev.bodyOverscroll;
      body.style.position = prev.bodyPosition;
      body.style.width = prev.bodyWidth;
      body.style.left = prev.bodyLeft;
      body.style.right = prev.bodyRight;
      body.style.top = prev.bodyTop;
      window.scrollTo(0, prev.scrollY);
    };
  }, [isMobile]);

  const addNyxResponse = useCallback(
    (content: string, opts?: { quiet?: boolean }) => {
      const msg: ChatMessageType = {
        id: generateId(),
        role: "nyx",
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, msg]);
      if (!opts?.quiet) playResponse();
    },
    [playResponse]
  );

  const persistTransaction = useCallback(
    async (
      parsed: ParsedTransaction,
      opts?: { trackInMonthlyCommitments?: boolean }
    ): Promise<string | null> => {
      if (!user?.id) return null;
      if (parsed._nyxAwaiting) return null;
      const p = stripNyxDialogMeta(parsed);
      const type = p.type === "income" ? "INCOME" : "EXPENSE";
      let amount = Math.abs(p.amount);
      const category = p.categorySuggested?.trim() || "Outros";
      let description = p.description || null;
      let occurredAt = p.date.toISOString();

      const plan = p.installmentPlan;
      const firstDue = plan?.firstDueDate;
      if (plan && firstDue != null) {
        const firstDueIso = firstDue.toISOString();
        const resPlan = await fetch("/api/installment-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category,
            description,
            totalInstallments: plan.count,
            installmentAmount: plan.amountEach,
            firstDueDate: firstDueIso,
            trackInCommitments: opts?.trackInMonthlyCommitments ?? false,
          }),
        });
        if (!resPlan.ok) {
          console.error("Failed to create installment plan", await resPlan.text());
          return null;
        }
        const data = (await resPlan.json()) as { firstTransactionId?: string };
        return data.firstTransactionId ?? null;
      }

      if (p.installmentPlan && !p.installmentPlan.firstDueDate) {
        return null;
      }

      if (p.recurringAccepted && p.recurringBill) {
        description = `${description ?? ""} · mensal dia ${p.recurringBill.dayOfMonth}`.trim();
      }
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount,
          category,
          description,
          occurredAt,
        }),
      });
      if (!res.ok) {
        console.error("Failed to create transaction", await res.text());
        return null;
      }
      const data = (await res.json()) as { id?: string };
      return data.id ?? null;
    },
    [user?.id]
  );

  const patchTransactionDescription = useCallback(
    async (transactionId: string, description: string) => {
      const res = await fetch(`/api/transactions/${transactionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) {
        console.error("Failed to update description", await res.text());
      }
    },
    []
  );

  const finishOptionalDescriptionFlow = useCallback(() => {
    optionalDescRef.current = null;
    setOptionalDescUi("none");
  }, []);

  const beginOptionalDescriptionUi = useCallback(
    (id: string | null, parsedForSummary: ParsedTransaction) => {
      if (id) {
        optionalDescRef.current = {
          transactionId: id,
          parsed: parsedForSummary,
          awaitingDescriptionLine: false,
          awaitingButtonChoice: true,
        };
        setOptionalDescUi("choose");
        addNyxResponse(getOptionalDescriptionPrompt());
      } else {
        addNyxResponse(formatTransactionSummaryCard(parsedForSummary));
      }
      setPendingTransaction(null);
    },
    [addNyxResponse]
  );

  const handleInstallmentCommitmentYes = useCallback(async () => {
    notifyInteraction();
    const p = installmentCommitmentRef.current;
    if (!p) return;
    installmentCommitmentRef.current = null;
    setShowCommitmentButtons(false);
    const id = await persistTransaction(p, { trackInMonthlyCommitments: true });
    addNyxResponse(
      "Perfeito — fica marcado para os teus **compromissos mensais** quando abrires o planeamento.",
      { quiet: true }
    );
    beginOptionalDescriptionUi(id, stripNyxDialogMeta(p));
    notifySuccess();
  }, [persistTransaction, beginOptionalDescriptionUi, addNyxResponse, notifyInteraction, notifySuccess, notifyMessageSent, notifyReviewReady, notifyError, resetToMaster, notifyTypingCleared, notifyTyping]);

  const handleInstallmentCommitmentNo = useCallback(async () => {
    notifyInteraction();
    const p = installmentCommitmentRef.current;
    if (!p) return;
    installmentCommitmentRef.current = null;
    setShowCommitmentButtons(false);
    const id = await persistTransaction(p, { trackInMonthlyCommitments: false });
    addNyxResponse("Beleza — fica só o **registro** das parcelas, sem acompanhamento extra.", {
      quiet: true,
    });
    beginOptionalDescriptionUi(id, stripNyxDialogMeta(p));
    notifySuccess();
  }, [persistTransaction, beginOptionalDescriptionUi, addNyxResponse, notifyInteraction, notifySuccess, notifyMessageSent, notifyReviewReady, notifyError, resetToMaster, notifyTypingCleared, notifyTyping]);

  const handleOptionalDescNo = useCallback(() => {
    notifyInteraction();
    const opt = optionalDescRef.current;
    if (!opt?.awaitingButtonChoice) return;
    finishOptionalDescriptionFlow();
    addNyxResponse(formatTransactionSummaryCard(opt.parsed));
    setPendingTransaction(null);
  }, [addNyxResponse, finishOptionalDescriptionFlow, notifyInteraction, notifySuccess, notifyMessageSent, notifyReviewReady, notifyError, resetToMaster, notifyTypingCleared, notifyTyping]);

  const handleOptionalDescYes = useCallback(() => {
    notifyInteraction();
    const opt = optionalDescRef.current;
    if (!opt?.awaitingButtonChoice) return;
    optionalDescRef.current = {
      ...opt,
      awaitingButtonChoice: false,
      awaitingDescriptionLine: true,
    };
    setOptionalDescUi("typing_description");
    addNyxResponse(getOptionalDescriptionTypeHint());
  }, [addNyxResponse, notifyInteraction, notifySuccess, notifyMessageSent, notifyReviewReady, notifyError, resetToMaster, notifyTypingCleared, notifyTyping]);

  const finishSpeaking = useCallback(() => {
    setNyxState("speaking");
    setTimeout(() => setNyxState("idle"), SPEAKING_DURATION_MS);
  }, []);

  const confirmActionsByIds = useCallback(
    async (actionIds: string[]) => {
      if (!pendingBatch || actionIds.length === 0 || persistingBatch) return;
      setPersistingBatch(true);
      setPersistingIds(actionIds);
      const { holdMs } = prepareThinking();
      const thinkUntil = Date.now() + holdMs;
      notifyMessageSent();
      setNyxState("thinking");
      const selected = pendingBatch.actions.filter((a) => actionIds.includes(a.actionId));
      const results = await persistNyxActions(selected);
      await waitUntil(thinkUntil);
      const failed: Record<string, string> = {};
      const okIds: string[] = [];
      for (const r of results) {
        if (r.ok) okIds.push(r.actionId);
        else failed[r.actionId] = r.error ?? "Falha ao salvar";
      }
      setFailedActionIds(failed);
      if (okIds.length) {
        const flashes = selected.filter((a) => okIds.includes(a.actionId)).map(actionToFlash);
        setSavedFlash((prev) => [...flashes, ...prev]);
        window.setTimeout(() => {
          setSavedFlash((prev) => prev.filter((f) => !okIds.includes(f.actionId)));
        }, 4200);
      }
      const next = mergePendingAfterConfirm(pendingBatch, okIds);
      setPendingBatch(next);
      if (Object.keys(failed).length === 0) {
        if (next) {
          notifyReviewReady();
          addNyxResponse("Beleza, salvei esses. Ainda sobrou umas pra conferir.");
        } else {
          notifySuccess();
          addNyxResponse("Pronto. Já registrei tudo.", { quiet: true });
        }
      } else {
        notifyError();
        addNyxResponse(
          okIds.length
            ? "Salvei parte. Alguns falharam — dá pra tentar de novo."
            : "Não consegui salvar. Tenta de novo?",
          { quiet: true }
        );
      }
      finishSpeaking();
      setPersistingBatch(false);
      setPersistingIds([]);
    },
    [pendingBatch, persistingBatch, addNyxResponse, finishSpeaking, prepareThinking, notifyInteraction, notifySuccess, notifyMessageSent, notifyReviewReady, notifyError, resetToMaster, notifyTypingCleared, notifyTyping]
  );

  const handleConfirmAllBatch = useCallback(() => {
    notifyInteraction();
    if (!pendingBatch) return;
    void confirmActionsByIds(pendingBatch.actions.map((a) => a.actionId));
  }, [pendingBatch, confirmActionsByIds, notifyInteraction, notifySuccess, notifyMessageSent, notifyReviewReady, notifyError, resetToMaster, notifyTypingCleared, notifyTyping]);

  const handleConfirmOneAction = useCallback(
    (actionId: string) => {
      notifyInteraction();
      void confirmActionsByIds([actionId]);
    },
    [confirmActionsByIds, notifyInteraction, notifySuccess, notifyMessageSent, notifyReviewReady, notifyError, resetToMaster, notifyTypingCleared, notifyTyping]
  );

  const handleCancelAllBatch = useCallback(() => {
    notifyInteraction();
    setPendingBatch(null);
    setFailedActionIds({});
    resetToMaster();
    addNyxResponse("Beleza, apaguei o rascunho.");
  }, [addNyxResponse, notifyInteraction, notifySuccess, notifyMessageSent, notifyReviewReady, notifyError, resetToMaster, notifyTypingCleared, notifyTyping]);

  const handleSend = useCallback(
    async (text: string, file?: File) => {
      const trimmed = text.trim();
      if (!trimmed && !file) return;
      if (sendingRef.current || persistingBatch) return;
      sendingRef.current = true;
      

      let attachment: ChatAttachment | undefined;
      if (file) {
        const url = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.onerror = rej;
          r.readAsDataURL(file);
        });
        attachment = { name: file.name, url, type: file.type };
      }

      const userContent = trimmed || "(anexo)";
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "user",
          content: userContent,
          timestamp: new Date(),
          attachment,
        },
      ]);
      playMessageSentSound();
      setNyxState("thinking");
      const { holdMs } = prepareThinking();
      notifyMessageSent();
      const thinkUntil = Date.now() + holdMs;

      const typingDelay =
        TYPING_DELAY_MS_MIN + Math.random() * (TYPING_DELAY_MS_MAX - TYPING_DELAY_MS_MIN);

      setTimeout(async () => {
        try {
          const input = trimmed || (file?.name ?? "");
          const releaseThinking = () => waitUntil(thinkUntil);

          const opt = optionalDescRef.current;
          if (opt?.awaitingButtonChoice && !file) {
            sendingRef.current = false;
            return;
          }

          if (showCommitmentButtons && !file) {
            sendingRef.current = false;
            return;
          }

          if (opt && !file && trimmed && opt.awaitingDescriptionLine) {
            await patchTransactionDescription(opt.transactionId, trimmed);
            await releaseThinking();
            finishOptionalDescriptionFlow();
            addNyxResponse(
              formatTransactionSummaryCard({
                ...opt.parsed,
                description: trimmed,
              })
            );
            setPendingTransaction(null);
            notifySuccess();
            return;
          }

          if (pendingBatch && !file && trimmed) {
            if (isLocalConfirmAll(trimmed)) {
              await confirmActionsByIds(pendingBatch.actions.map((a) => a.actionId));
              return;
            }
            if (isLocalCancelAll(trimmed)) {
              await releaseThinking();
              handleCancelAllBatch();
              return;
            }
          }

          try {
            const interpretation = await interpretNyxMessageClient(input, pendingBatch, {
              userCategories: USER_CATEGORIES,
            });
            await releaseThinking();

            if (interpretation.intent === "CONFIRM_PENDING_ACTIONS") {
              const ids =
                interpretation.actions.length > 0
                  ? interpretation.actions.map((a) => a.actionId)
                  : pendingBatch?.actions.map((a) => a.actionId) ?? [];
              if (interpretation.reply) addNyxResponse(interpretation.reply, { quiet: true });
              await confirmActionsByIds(ids);
              if (interpretation.pendingBatch) {
                setPendingBatch(interpretation.pendingBatch);
                notifyReviewReady();
              }
              return;
            }

            if (interpretation.intent === "CANCEL_PENDING_ACTIONS") {
              setPendingBatch(null);
              setFailedActionIds({});
              resetToMaster();
              addNyxResponse(interpretation.reply || "Beleza, cancelei.");
              return;
            }

            if (
              interpretation.requiresConfirmation &&
              interpretation.pendingBatch &&
              interpretation.pendingBatch.actions.length > 0
            ) {
              setPendingBatch(interpretation.pendingBatch);
              setFailedActionIds({});
              setPendingTransaction(null);
              notifyReviewReady();
              addNyxResponse(interpretation.reply);
              return;
            }

            if (interpretation.pendingBatch) {
              setPendingBatch(interpretation.pendingBatch);
              if (interpretation.pendingBatch.actions.length) {
                notifyReviewReady();
              } else {
                resetToMaster();
              }
            } else if (!pendingBatch) {
              setPendingBatch(null);
            }

            addNyxResponse(interpretation.reply);
            if (!interpretation.pendingBatch?.actions.length) {
              resetToMaster();
            }
            return;
          } catch (smartErr) {
            console.error("interpretNyxMessageClient", smartErr);
            // Continua no parser local abaixo — não deixa o chat preso
          }

          try {
            const flow = await handleNyxMessage(input, USER_CATEGORIES, pendingTransaction, {
              userDisplayName: displayName,
            });
            await releaseThinking();
            if (
              flow.state === "awaiting_confirmation" ||
              flow.state === "awaiting_installment_first_due" ||
              flow.state === "awaiting_installment_amount" ||
              flow.state === "awaiting_installment_count" ||
              flow.state === "awaiting_recurring_choice"
            ) {
              setPendingTransaction(flow.parsed ?? null);
              notifyReviewReady();
            } else {
              setPendingTransaction(null);
            }
            if (flow.state === "idle" && flow.parsed) {
              setPendingTransaction(null);
              addNyxResponse(flow.reply);
              if (flow.deferInstallmentCommitmentPrompt) {
                installmentCommitmentRef.current = flow.parsed;
                addNyxResponse(getInstallmentCommitmentPrompt());
                setShowCommitmentButtons(true);
                notifyReviewReady();
              } else {
                const id = await persistTransaction(flow.parsed);
                beginOptionalDescriptionUi(id, stripNyxDialogMeta(flow.parsed));
                notifySuccess();
              }
            } else {
              addNyxResponse(flow.reply || "Não entendi esse. Tenta tipo: café 15 hoje");
            }
          } catch (localErr) {
            console.error("handleNyxMessage fallback", localErr);
            await releaseThinking();
            notifyError();
            addNyxResponse(
              "Não consegui processar agora. Tenta de novo? Ex: café 15 hoje",
              { quiet: true }
            );
          }
        } catch (e) {
          console.error("handleSend", e);
          await waitUntil(thinkUntil);
          notifyError();
          addNyxResponse("Algo deu errado. Tenta de novo?", { quiet: true });
          setPendingTransaction(null);
          optionalDescRef.current = null;
          setOptionalDescUi("none");
          installmentCommitmentRef.current = null;
          setShowCommitmentButtons(false);
        } finally {
          finishSpeaking();
          sendingRef.current = false;
        }
      }, typingDelay);
    },
    [
      addNyxResponse,
      pendingTransaction,
      pendingBatch,
      persistTransaction,
      patchTransactionDescription,
      finishOptionalDescriptionFlow,
      beginOptionalDescriptionUi,
      showCommitmentButtons,
      displayName,
      confirmActionsByIds,
      handleCancelAllBatch,
      persistingBatch,
      finishSpeaking,
      prepareThinking,
      notifyInteraction, notifySuccess, notifyMessageSent, notifyReviewReady, notifyError, resetToMaster, notifyTypingCleared, notifyTyping,
    ]
  );

  const handleMicToggle = useCallback(() => {
    notifyInteraction();
    if (
      optionalDescUi === "choose" ||
      optionalDescUi === "typing_description" ||
      showCommitmentButtons
    ) {
      return;
    }
    if (isListening) {
      setIsListening(false);
      setNyxState("idle");
      if (listeningTimeoutRef.current) clearTimeout(listeningTimeoutRef.current);
      return;
    }
    setIsListening(true);
    setNyxState("listening");
    notifyTyping();
    const t = setTimeout(() => {
      setIsListening(false);
      setNyxState("thinking");
      const { holdMs } = prepareThinking();
      notifyMessageSent();
      const fakeTranscript = "O que você pode fazer por mim?";
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "user",
          content: fakeTranscript,
          timestamp: new Date(),
        },
      ]);
      setTimeout(() => {
        addNyxResponse(
          SIMULATED_RESPONSES[Math.floor(Math.random() * SIMULATED_RESPONSES.length)]
        );
        setNyxState("speaking");
        resetToMaster();
        setTimeout(() => setNyxState("idle"), SPEAKING_DURATION_MS);
      }, Math.max(FALLBACK_RESPONSE_DELAY_MS, holdMs));
    }, 3000);
    listeningTimeoutRef.current = t;
  }, [
    isListening,
    addNyxResponse,
    optionalDescUi,
    showCommitmentButtons,
    notifyInteraction, notifySuccess, notifyMessageSent, notifyReviewReady, notifyError, resetToMaster, notifyTypingCleared, notifyTyping, prepareThinking,
  ]);

  const isBusy = nyxState === "thinking" || nyxState === "listening" || persistingBatch;
  const chatLocked = optionalDescUi === "choose" || showCommitmentButtons;

  useEffect(() => {
    if (nyxState !== "idle" || chatLocked || isBusy) return;
    const t = window.setTimeout(() => nyxInputRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, [nyxState, messages.length, chatLocked, isBusy, optionalDescUi]);

  const idleAudioTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearIdleAudioTimer = useCallback(() => {
    if (idleAudioTimerRef.current) {
      clearTimeout(idleAudioTimerRef.current);
      idleAudioTimerRef.current = null;
    }
  }, []);

  /** Sincroniza microsons com a máquina de sprites (sem alterar a máquina). */
  useEffect(() => {
    const prev = prevVisualRef.current;
    const next = visualState;
    prevVisualRef.current = next;

    if (next === "thinking") {
      playThinking();
    } else if (prev === "thinking") {
      stopThinking("interpretation ready");
    }

    if (next === "sucess" && prev !== "sucess") {
      playSuccess();
    }
    if (next === "error" && prev !== "error") {
      playError();
    }

    if (isCigarroState(next) && !isCigarroState(prev)) {
      // Entrou no modo espera: toca agora e agenda as repetições
      playCigarette();
      const scheduleNext = (delayMs: number) => {
        clearIdleAudioTimer();
        idleAudioTimerRef.current = setTimeout(() => {
          if (!isCigarroState(prevVisualRef.current)) return;
          playCigarette();
          scheduleNext(
            IDLE_AUDIO_REPEAT_MIN_MS +
              Math.random() *
                (IDLE_AUDIO_REPEAT_MAX_MS - IDLE_AUDIO_REPEAT_MIN_MS)
          );
        }, delayMs);
      };
      scheduleNext(IDLE_AUDIO_REPEAT_FIRST_MS);
    }
    if (isCigarroState(prev) && !isCigarroState(next)) {
      clearIdleAudioTimer();
      stopCigarette();
    }
  }, [
    visualState,
    playThinking,
    stopThinking,
    playSuccess,
    playError,
    playCigarette,
    stopCigarette,
    clearIdleAudioTimer,
  ]);

  useEffect(() => clearIdleAudioTimer, [clearIdleAudioTimer]);

  useEffect(() => {
    return () => stopAllSounds();
  }, [stopAllSounds]);

  const nyxStageStatus = stageStatusLabel(visualState, {
    hasPending: Boolean(pendingBatch?.actions.length),
    persisting: persistingBatch,
    listening: isListening,
  });

  const companionHint =
    isBusy || persistingBatch
      ? "Nyx está pensando…"
      : isTypingDraft
        ? "Nyx está acompanhando…"
        : null;

  const handleShortcutSelect = useCallback(
    (text: string) => {
      unlockSounds();
      notifyInteraction();
      nyxInputRef.current?.setValue(text);
      notifyTyping();
      setIsTypingDraft(true);
    },
    [unlockSounds, notifyInteraction, notifyTyping]
  );

  const scrollFooter = (
    <>
      {(pendingBatch && pendingBatch.actions.length > 0) || savedFlash.length > 0 ? (
        <div className="py-2">
          <NyxActionReview
            batch={pendingBatch}
            failedIds={failedActionIds}
            persisting={persistingBatch}
            persistingIds={persistingIds}
            savedFlash={savedFlash}
            onChangeBatch={(b) => {
              notifyInteraction();
              setPendingBatch(b);
              if (b?.actions.length) notifyReviewReady();
              else resetToMaster();
            }}
            onConfirmAll={handleConfirmAllBatch}
            onCancelAll={handleCancelAllBatch}
            onConfirmOne={handleConfirmOneAction}
            onCorrectWithNyx={() => {
              notifyInteraction();
              nyxInputRef.current?.focus();
            }}
          />
        </div>
      ) : null}

      {showCommitmentButtons && (
        <div className="flex justify-center gap-3 px-4 pb-2">
          <button
            type="button"
            onClick={handleInstallmentCommitmentNo}
            className="min-w-[100px] rounded-xl border border-[var(--border)] bg-[var(--muted)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)]"
          >
            Não
          </button>
          <button
            type="button"
            onClick={handleInstallmentCommitmentYes}
            className="min-w-[100px] rounded-xl bg-gradient-to-r from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)] px-5 py-2.5 text-sm font-medium text-white"
          >
            Sim
          </button>
        </div>
      )}

      {!showCommitmentButtons && optionalDescUi === "choose" && (
        <div className="flex justify-center gap-3 px-4 pb-2">
          <button
            type="button"
            onClick={handleOptionalDescNo}
            className="min-w-[100px] rounded-xl border border-[var(--border)] bg-[var(--muted)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)]"
          >
            Não
          </button>
          <button
            type="button"
            onClick={handleOptionalDescYes}
            className="min-w-[100px] rounded-xl bg-gradient-to-r from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)] px-5 py-2.5 text-sm font-medium text-white"
          >
            Sim
          </button>
        </div>
      )}
    </>
  );

  const composer = (
    <NyxInput
      ref={nyxInputRef}
      size={isMobile ? "default" : "large"}
      companionHint={companionHint}
      onSend={handleSend}
      onMicToggle={handleMicToggle}
      isListening={isListening}
      disabled={isBusy}
      chatLocked={chatLocked}
      descriptionTypingOnly={optionalDescUi === "typing_description"}
      onTypingChange={(typing) => {
        setIsTypingDraft(typing);
        unlockSounds();
        if (typing) {
          notifyTyping();
          playTyping();
        } else {
          notifyTypingCleared();
        }
      }}
    />
  );

  return (
    <div
      className={`relative flex min-h-0 flex-col overflow-hidden ${
        isMobile ? "md:relative" : "h-[calc(100dvh-3.5rem)]"
      }`}
      data-nyx-visual={visualState}
      onPointerDownCapture={() => {
        unlockSounds();
        notifyInteraction();
      }}
    >
      {showBoot ? (
        <NyxBootScreen
          ready={assistant.assetsReady && !assistant.isLoading}
          onDone={() => setBootDone(true)}
        />
      ) : null}

      {/* Sala digital — fundo unificado */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 55% 70% at 18% 40%, rgba(24,20,36,0.9), transparent 70%),
            radial-gradient(ellipse 50% 65% at 82% 45%, rgba(28,22,48,0.55), transparent 72%),
            linear-gradient(180deg, rgba(10,10,14,0.2) 0%, transparent 40%)
          `,
        }}
      />

      {isMobile ? (
        <div className="fixed inset-0 z-30 flex h-[100dvh] min-h-0 w-full max-w-full flex-col overflow-hidden bg-[var(--background)]">
          {/* 1. Personagem — shrink-0, sprite inteira (object-contain) */}
          <header className="relative h-[min(32dvh,260px)] min-h-[140px] w-full max-w-full shrink-0 overflow-hidden">
            <div className="absolute right-3 top-[max(0.5rem,env(safe-area-inset-top))] z-30">
              <NyxSoundToggle enabled={soundEnabled} onChange={setSoundEnabled} />
            </div>
            <NyxAvatarStage
              state={visualState}
              compact
              className="h-full w-full"
            />
          </header>

          {/* 2. Única área rolável */}
          <section className="relative min-h-0 min-w-0 flex-1 overflow-hidden border-t border-white/[0.06] bg-[var(--background)]/80">
            <NyxChat
              messages={messages}
              isThinking={nyxState === "thinking"}
              className="h-full min-h-0"
              onShortcutSelect={handleShortcutSelect}
              scrollFooter={scrollFooter}
            />
          </section>

          {/* 3. Composer preso ao shell */}
          <div className="w-full max-w-full shrink-0 border-t border-white/[0.04] bg-[var(--background)]">
            {composer}
          </div>

          {/* 4. Bottom nav preso ao shell */}
          <div className="w-full max-w-full shrink-0">
            <BottomNav variant="inline" />
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex min-h-0 flex-1 flex-row">
          <div className="relative flex min-h-0 min-w-0 w-[58%] max-w-[58%] flex-col">
            <div
              className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-16"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(12,10,18,0.35) 100%)",
              }}
              aria-hidden
            />
            <div className="relative flex min-h-0 flex-1 flex-col">
              <NyxChat
                messages={messages}
                isThinking={nyxState === "thinking"}
                className="min-h-0 flex-1"
                onShortcutSelect={handleShortcutSelect}
                scrollFooter={scrollFooter}
              />
              <div className="shrink-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/95 to-transparent px-0 pb-6 pt-4">
                {composer}
              </div>
            </div>
          </div>

          <div className="relative w-[42%] max-w-[42%] shrink-0 self-stretch overflow-hidden">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28"
              style={{
                background:
                  "linear-gradient(90deg, rgba(10,10,14,0.55) 0%, transparent 100%)",
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 80% 70% at 70% 50%, rgba(139,92,246,0.07), transparent 65%)",
              }}
              aria-hidden
            />
            <NyxAvatarStage
              state={visualState}
              statusLabel={nyxStageStatus}
              controls={
                <NyxSoundToggle enabled={soundEnabled} onChange={setSoundEnabled} />
              }
              className="h-full w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
