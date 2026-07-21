"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type WheelEvent,
} from "react";

interface HorizontalSnapCarouselProps {
  children: ReactNode;
  slideClassName?: string;
  dotCount?: number;
  className?: string;
}

function getActiveIndex(container: HTMLElement): number {
  const children = Array.from(container.children) as HTMLElement[];
  if (children.length === 0) return 0;

  const scrollLeft = container.scrollLeft;
  let closest = 0;
  let minDist = Infinity;

  for (let i = 0; i < children.length; i++) {
    const dist = Math.abs(children[i]!.offsetLeft - scrollLeft);
    if (dist < minDist) {
      minDist = dist;
      closest = i;
    }
  }
  return closest;
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("button, a, input, select, textarea, [role='switch'], label"));
}

export function HorizontalSnapCarousel({
  children,
  slideClassName = "min-w-[86%] shrink-0 snap-start sm:min-w-[320px]",
  dotCount,
  className = "",
}: HorizontalSnapCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0 });
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);

  const count = dotCount ?? (Array.isArray(children) ? children.length : 1);

  const syncActive = useCallback(() => {
    const el = trackRef.current;
    if (!el || dragRef.current.active) return;
    const idx = getActiveIndex(el);
    setActive((prev) => (prev === idx ? prev : idx));
  }, []);

  const snapToIndex = useCallback((index: number, smooth = true) => {
    const el = trackRef.current;
    if (!el) return;
    const child = el.children[index] as HTMLElement | undefined;
    if (!child) return;
    el.scrollTo({ left: child.offsetLeft, behavior: smooth ? "smooth" : "auto" });
    setActive(index);
  }, []);

  const snapToNearest = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    snapToIndex(getActiveIndex(el), true);
  }, [snapToIndex]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    syncActive();
    el.addEventListener("scroll", syncActive, { passive: true });
    return () => el.removeEventListener("scroll", syncActive);
  }, [syncActive, count]);

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: MouseEvent) => {
      const el = trackRef.current;
      if (!el || !dragRef.current.active) return;
      e.preventDefault();
      const dx = e.pageX - dragRef.current.startX;
      el.scrollLeft = dragRef.current.scrollLeft - dx;
    };

    const onUp = () => {
      if (!dragRef.current.active) return;
      dragRef.current.active = false;
      setDragging(false);
      snapToNearest();
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [dragging, snapToNearest]);

  const onMouseDown = (e: ReactMouseEvent) => {
    const el = trackRef.current;
    if (!el || e.button !== 0 || isInteractiveTarget(e.target)) return;
    dragRef.current = {
      active: true,
      startX: e.pageX,
      scrollLeft: el.scrollLeft,
    };
    setDragging(true);
  };

  const onWheel = (e: WheelEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (delta === 0) return;
    e.preventDefault();
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        ref={trackRef}
        role="region"
        aria-roledescription="carrossel"
        tabIndex={0}
        className={[
          "flex gap-3 overflow-x-auto overscroll-x-contain pb-1",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "scroll-smooth",
          dragging ? "cursor-grabbing snap-none" : "cursor-grab snap-x snap-mandatory",
          "touch-pan-x",
        ].join(" ")}
        onMouseDown={onMouseDown}
        onWheel={onWheel}
      >
        {Array.isArray(children)
          ? children.map((child, i) => (
              <div key={i} className={slideClassName}>
                {child}
              </div>
            ))
          : (
              <div className={slideClassName}>{children}</div>
            )}
      </div>

      {count > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir para slide ${i + 1}`}
              onClick={() => snapToIndex(i, true)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active
                  ? "w-5 bg-[var(--nyx-gradient-start)]"
                  : "w-1.5 bg-[var(--muted)] hover:bg-[var(--muted-foreground)]/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
