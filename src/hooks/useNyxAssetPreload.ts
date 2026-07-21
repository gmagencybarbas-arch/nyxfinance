"use client";

import { useEffect, useRef } from "react";
import { NYX_ASSETS, type NyxVisualState } from "@/components/nyx/avatar/types";
import { useAssistantOptional } from "@/contexts/AssistantContext";
import type { SkinAssetConfig } from "@/lib/assistant/types";

function assetListFromConfig(assets: SkinAssetConfig): string[] {
  const keys = [
    "master",
    "typing",
    "thinking",
    "sucess",
    "error",
    "special01",
    "special02",
  ] as const;
  const list: string[] = [];
  for (const k of keys) {
    const src = assets[k];
    if (src && !list.includes(src)) list.push(src);
  }
  for (const src of assets.thinkingVariants ?? []) {
    if (src && !list.includes(src)) list.push(src);
  }
  return list;
}

/**
 * Pré-carrega sprites da skin ativa (ou Nyx padrão).
 * NÃO bloqueia a troca de estado.
 */
export function useNyxAssetPreload() {
  const assistant = useAssistantOptional();
  const activeAssets = assistant?.activeAssets;
  const skinId = assistant?.selectedSkin?.id ?? "nyx-default";
  const startedForRef = useRef<string | null>(null);
  const lastVisualStateRef = useRef<NyxVisualState | null>(null);
  const thinkingPickRef = useRef<{ skinId: string; src: string } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (startedForRef.current === skinId) return;
    startedForRef.current = skinId;

    let cancelled = false;
    const list = activeAssets ? assetListFromConfig(activeAssets) : [];
    if (!list.length) {
      // Ainda hidratando — não pré-carrega Nyx por engano
      startedForRef.current = null;
      return;
    }
    const master = activeAssets?.master || list[0]!;

    const loadOne = (src: string) =>
      new Promise<void>((resolve) => {
        const img = new window.Image();
        img.decoding = "async";
        img.onload = () => resolve();
        img.onerror = () => {
          if (process.env.NODE_ENV === "development") {
            console.warn(`[Nyx] falha ao pré-carregar asset: ${src}`);
          }
          resolve();
        };
        img.src = src;
      });

    (async () => {
      await loadOne(master);
      if (cancelled) return;
      const rest = list.filter((src) => src !== master);
      for (const src of rest) {
        if (cancelled) return;
        await loadOne(src);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [skinId, activeAssets]);

  const resolveSrc = (state: NyxVisualState): string => {
    // Sem assets hidratados: não cai no mapa da Nyx (evita flash)
    if (assistant && (!activeAssets || !activeAssets.master)) {
      return "";
    }

    const variants = activeAssets?.thinkingVariants?.filter(Boolean) ?? [];
    if (state === "thinking" && variants.length > 0) {
      const enteringThinking = lastVisualStateRef.current !== "thinking";
      const changedSkin = thinkingPickRef.current?.skinId !== skinId;
      if (enteringThinking || changedSkin || !thinkingPickRef.current) {
        const src = variants[Math.floor(Math.random() * variants.length)]!;
        thinkingPickRef.current = { skinId, src };
      }
      lastVisualStateRef.current = state;
      return thinkingPickRef.current.src;
    }

    lastVisualStateRef.current = state;
    if (assistant?.resolveVisualSrc) {
      return assistant.resolveVisualSrc(state);
    }
    return NYX_ASSETS[state];
  };

  const ready = assistant ? assistant.assetsReady : true;

  return { ready, failed: {}, resolveSrc };
}
