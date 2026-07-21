"use client";

import { useEffect, useRef } from "react";
import type { StoreItem } from "@/lib/assistant/types";
import { StoreItemCard } from "./StoreItemCard";

interface StoreGalleryProps {
  items: StoreItem[];
  focusedId: string | null;
  onFocus: (id: string) => void;
}

export function StoreGallery({ items, focusedId, onFocus }: StoreGalleryProps) {
  return (
    <div
      className="hidden h-full items-end gap-3 md:flex lg:gap-4"
      role="listbox"
      aria-label="Galeria de personagens e visuais"
    >
      {items.map((item) => {
        const focused = item.id === focusedId;
        return (
          <div
            key={item.id}
            role="option"
            aria-selected={focused}
            className={`min-w-0 flex-1 transition-[flex] duration-200 ${
              focused ? "flex-[1.18]" : "flex-[0.92]"
            }`}
          >
            <StoreItemCard
              item={item}
              focused={focused}
              onFocus={() => onFocus(item.id)}
            />
          </div>
        );
      })}
    </div>
  );
}

export function StoreMobileCarousel({
  items,
  focusedId,
  onFocus,
}: StoreGalleryProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !focusedId) return;
    const idx = items.findIndex((i) => i.id === focusedId);
    const child = el.children[idx] as HTMLElement | undefined;
    if (!child) return;
    child.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [focusedId, items]);

  return (
    <div
      ref={scrollerRef}
      className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="listbox"
      aria-label="Galeria de personagens e visuais"
    >
      {items.map((item) => {
        const focused = item.id === focusedId;
        return (
          <div
            key={item.id}
            role="option"
            aria-selected={focused}
            className="w-[72%] max-w-[280px] shrink-0 snap-center sm:w-[58%]"
          >
            <StoreItemCard
              item={item}
              focused={focused}
              onFocus={() => onFocus(item.id)}
              compact
            />
          </div>
        );
      })}
    </div>
  );
}
