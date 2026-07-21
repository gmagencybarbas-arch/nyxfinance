"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { CHARACTER_IDS, SKIN_IDS } from "@/lib/assistant/ids";
import {
  getCharacterConfigById,
  personalityKeyForCharacterId,
  audioKeyForCharacterId,
} from "@/lib/assistant/characterConfig";
import { getSkinConfigById, SKIN_CONFIG } from "@/lib/assistant/skinConfig";
import type {
  AssistantPreferenceDto,
  AssistantStateDto,
  CharacterDto,
  CharacterRuntimeConfig,
  SkinAssetConfig,
  SkinDto,
  SkinRuntimeConfig,
  StoreItem,
} from "@/lib/assistant/types";
import type { NyxVisualState } from "@/components/nyx/avatar/types";
import { NYX_ASSETS } from "@/components/nyx/avatar/types";

type AssistantContextValue = {
  isLoading: boolean;
  error: string | null;
  selectedCharacter: CharacterDto | null;
  selectedSkin: SkinDto | null;
  selectedCharacterConfig: CharacterRuntimeConfig | null;
  selectedSkinConfig: SkinRuntimeConfig | null;
  activeAssets: SkinAssetConfig;
  activeAudioKey: string;
  activePersonalityKey: string;
  availableStoreItems: StoreItem[];
  unlockedCharacters: string[];
  unlockedSkins: string[];
  preference: AssistantPreferenceDto | null;
  focusedStoreItemId: string | null;
  setFocusedStoreItemId: (id: string | null) => void;
  selectStoreItem: (item: StoreItem) => Promise<boolean>;
  switchCharacter: (characterId: string, skinId?: string) => Promise<boolean>;
  switchSkin: (skinId: string) => Promise<boolean>;
  resolveVisualSrc: (state: NyxVisualState) => string;
  refresh: () => Promise<void>;
  assetsReady: boolean;
};

const AssistantContext = createContext<AssistantContextValue | null>(null);

const FALLBACK_ASSETS: SkinAssetConfig = {
  ...NYX_ASSETS,
  special01: NYX_ASSETS.cigarro01,
  special02: NYX_ASSETS.cigarro02,
  storePreview: NYX_ASSETS.master,
  storeThumbnail: NYX_ASSETS.master,
  width: 996,
  height: 990,
  placeholder: false,
};

function mapVisualStateToAsset(
  assets: SkinAssetConfig,
  state: NyxVisualState
): string {
  const hasAssets = Boolean(assets.master || assets.typing || assets.thinking);
  if (!hasAssets) return "";

  switch (state) {
    case "master":
      return assets.master || "";
    case "typing":
      return assets.typing || assets.master || "";
    case "thinking":
      return assets.thinking || assets.master || "";
    case "sucess":
      return assets.sucess || assets.master || "";
    case "error":
      return assets.error || assets.master || "";
    case "cigarro01":
      return assets.special01 || assets.master || "";
    case "cigarro02":
      return assets.special02 || assets.master || "";
    default:
      return assets.master || "";
  }
}

async function fetchAssistantState(): Promise<AssistantStateDto | null> {
  const res = await fetch("/api/assistant");
  if (!res.ok) return null;
  return (await res.json()) as AssistantStateDto;
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<AssistantStateDto | null>(null);
  const [focusedStoreItemId, setFocusedStoreItemId] = useState<string | null>(
    null
  );
  const [assetsReady, setAssetsReady] = useState(false);
  const rollbackRef = useRef<AssistantPreferenceDto | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setState(null);
      setIsLoading(false);
      setAssetsReady(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const next = await fetchAssistantState();
      if (!next) {
        setError("Não foi possível carregar a assistente.");
        setState(null);
        setAssetsReady(false);
        return;
      }
      setState(next);
      setFocusedStoreItemId((prev) => {
        if (prev) return prev;
        const inUse = next.storeItems.find((i) => i.status === "in_use");
        return inUse?.id ?? next.storeItems[0]?.id ?? null;
      });
      setAssetsReady(true);
    } catch {
      setError("Falha ao carregar a assistente.");
      setAssetsReady(false);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectedCharacter = useMemo(() => {
    if (!state) return null;
    return (
      state.characters.find(
        (c) => c.id === state.preference.selectedCharacterId
      ) ?? null
    );
  }, [state]);

  const selectedSkin = useMemo(() => {
    if (!state) return null;
    return (
      state.skins.find((s) => s.id === state.preference.selectedSkinId) ?? null
    );
  }, [state]);

  const selectedCharacterConfig = selectedCharacter
    ? getCharacterConfigById(selectedCharacter.id)
    : null;

  const selectedSkinConfig = selectedSkin
    ? getSkinConfigById(selectedSkin.id)
    : null;

  const activeAssets: SkinAssetConfig = useMemo(() => {
    // Runtime config primeiro: deploy de assets não depende de seed antigo no DB
    if (selectedSkinConfig?.assets && Object.keys(selectedSkinConfig.assets).length) {
      return selectedSkinConfig.assets;
    }
    if (selectedSkin?.assetConfig && Object.keys(selectedSkin.assetConfig).length) {
      return selectedSkin.assetConfig;
    }
    // Enquanto carrega, mantém assets vazios para o avatar não flashar Nyx
    if (isLoading || !state) return {};
    return FALLBACK_ASSETS;
  }, [selectedSkin, selectedSkinConfig, isLoading, state]);

  const activePersonalityKey = selectedCharacter
    ? personalityKeyForCharacterId(selectedCharacter.id)
    : "nyx";

  const activeAudioKey = selectedCharacter
    ? audioKeyForCharacterId(selectedCharacter.id)
    : "nyx";

  const availableStoreItems = useMemo(() => {
    if (!state) return [];
    // Usa storeItems do servidor (progresso real). Só reaplicamos o foco local.
    return state.storeItems.map((item) => {
      const focused = focusedStoreItemId === item.id;
      if (!focused && item.status !== "selected") return item;
      if (item.status === "in_use" || item.status === "locked" || item.status === "coming_soon" || item.status === "unavailable") {
        return item;
      }
      return { ...item, status: focused ? ("selected" as const) : item.status };
    });
  }, [state, focusedStoreItemId]);

  const persistSelection = useCallback(
    async (characterId: string, skinId: string): Promise<boolean> => {
      if (!state) return false;
      const previous = state.preference;
      rollbackRef.current = previous;

      // Otimista
      setState((prev) =>
        prev
          ? {
              ...prev,
              preference: {
                ...prev.preference,
                selectedCharacterId: characterId,
                selectedSkinId: skinId,
                updatedAt: new Date().toISOString(),
              },
            }
          : prev
      );

      try {
        const res = await fetch("/api/assistant/selection", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ characterId, skinId }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? "Falha ao salvar");
        }
        const data = (await res.json()) as {
          preference: AssistantPreferenceDto;
        };
        setState((prev) =>
          prev ? { ...prev, preference: data.preference } : prev
        );
        return true;
      } catch (e) {
        setState((prev) =>
          prev && rollbackRef.current
            ? { ...prev, preference: rollbackRef.current }
            : prev
        );
        toast.show(
          e instanceof Error ? e.message : "Não foi possível trocar",
          "error"
        );
        return false;
      }
    },
    [state, toast]
  );

  const selectStoreItem = useCallback(
    async (item: StoreItem) => {
      if (
        item.status === "locked" ||
        item.status === "coming_soon" ||
        item.status === "unavailable"
      ) {
        toast.show("Este item ainda está bloqueado", "info");
        return false;
      }
      return persistSelection(item.characterId, item.skinId);
    },
    [persistSelection, toast]
  );

  const switchCharacter = useCallback(
    async (characterId: string, skinId?: string) => {
      if (!state) return false;
      const skin =
        skinId ??
        state.skins.find((s) => s.characterId === characterId && s.isDefault)
          ?.id ??
        SKIN_IDS.nyxDefault;
      return persistSelection(characterId, skin);
    },
    [persistSelection, state]
  );

  const switchSkin = useCallback(
    async (skinId: string) => {
      if (!state) return false;
      const skin = state.skins.find((s) => s.id === skinId);
      if (!skin) return false;
      return persistSelection(skin.characterId, skin.id);
    },
    [persistSelection, state]
  );

  const resolveVisualSrc = useCallback(
    (visualState: NyxVisualState) => mapVisualStateToAsset(activeAssets, visualState),
    [activeAssets]
  );

  const value = useMemo<AssistantContextValue>(
    () => ({
      isLoading,
      error,
      selectedCharacter,
      selectedSkin,
      selectedCharacterConfig,
      selectedSkinConfig,
      activeAssets,
      activeAudioKey,
      activePersonalityKey,
      availableStoreItems,
      unlockedCharacters: state?.unlockedCharacterIds ?? [CHARACTER_IDS.nyx],
      unlockedSkins: state?.unlockedSkinIds ?? [SKIN_IDS.nyxDefault],
      preference: state?.preference ?? null,
      focusedStoreItemId,
      setFocusedStoreItemId,
      selectStoreItem,
      switchCharacter,
      switchSkin,
      resolveVisualSrc,
      refresh,
      assetsReady: assetsReady && !isLoading,
    }),
    [
      isLoading,
      error,
      selectedCharacter,
      selectedSkin,
      selectedCharacterConfig,
      selectedSkinConfig,
      activeAssets,
      activeAudioKey,
      activePersonalityKey,
      availableStoreItems,
      state,
      focusedStoreItemId,
      selectStoreItem,
      switchCharacter,
      switchSkin,
      resolveVisualSrc,
      refresh,
      assetsReady,
    ]
  );

  return (
    <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>
  );
}

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) {
    throw new Error("useAssistant must be used within AssistantProvider");
  }
  return ctx;
}

/** Versão segura para áreas que podem renderizar fora do provider. */
export function useAssistantOptional() {
  return useContext(AssistantContext);
}

/** Export útil para testes / preload. */
export { SKIN_CONFIG };
