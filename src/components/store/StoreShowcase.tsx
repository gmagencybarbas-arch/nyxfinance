"use client";

import { useMemo, useState } from "react";
import { useAssistant } from "@/contexts/AssistantContext";
import { Skeleton } from "@/components/ui";
import { StoreGallery, StoreMobileCarousel } from "./StoreGallery";
import { StoreMissionPanel } from "./StoreMissionPanel";

export function StoreShowcase() {
  const {
    isLoading,
    error,
    availableStoreItems,
    focusedStoreItemId,
    setFocusedStoreItemId,
    selectStoreItem,
    refresh,
  } = useAssistant();
  const [selecting, setSelecting] = useState(false);

  const focusedItem = useMemo(() => {
    if (!availableStoreItems.length) return null;
    return (
      availableStoreItems.find((i) => i.id === focusedStoreItemId) ??
      availableStoreItems[0] ??
      null
    );
  }, [availableStoreItems, focusedStoreItemId]);

  const handleUse = async () => {
    if (!focusedItem) return;
    setSelecting(true);
    try {
      await selectStoreItem(focusedItem);
    } finally {
      setSelecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-[minmax(260px,34%)_1fr] md:gap-6">
        <Skeleton className="h-[420px] rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[360px] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
        <p className="text-sm text-amber-200">{error}</p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-3 text-sm font-medium text-violet-300 underline-offset-2 hover:underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 md:grid md:min-h-[560px] md:grid-cols-[minmax(260px,34%)_minmax(0,1fr)] md:gap-6 lg:grid-cols-[minmax(280px,32%)_minmax(0,1fr)]">
      <div className="order-2 md:order-1 md:h-full">
        <StoreMissionPanel
          item={focusedItem}
          selecting={selecting}
          onUse={() => void handleUse()}
        />
      </div>

      <div className="order-1 min-w-0 md:order-2 md:h-full">
        <StoreMobileCarousel
          items={availableStoreItems}
          focusedId={focusedItem?.id ?? null}
          onFocus={setFocusedStoreItemId}
        />
        <StoreGallery
          items={availableStoreItems}
          focusedId={focusedItem?.id ?? null}
          onFocus={setFocusedStoreItemId}
        />
      </div>
    </div>
  );
}
