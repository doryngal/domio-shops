"use client";
import { useRef, useCallback } from "react";

interface Options {
  onClose: () => void;
  /** fraction of sheet height to trigger close (default 0.3) */
  threshold?: number;
  /** px/ms velocity to trigger close (default 0.5) */
  velocityThreshold?: number;
}

/**
 * Returns props to spread onto the draggable sheet element.
 * Only activates on mobile (pointer is coarse / touch).
 * Animates via direct DOM style mutation for 60fps — bypasses React re-renders.
 */
export function useDragDismiss({ onClose, threshold = 0.3, velocityThreshold = 0.5 }: Options) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startTime = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    // only on mobile-ish
    if (window.matchMedia("(pointer: fine)").matches) return;
    startY.current = e.touches[0].clientY;
    startTime.current = Date.now();
    currentY.current = 0;
    isDragging.current = true;
    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !sheetRef.current) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy < 0) return; // don't allow dragging up
    currentY.current = dy;
    sheetRef.current.style.transform = `translateY(${dy}px)`;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!isDragging.current || !sheetRef.current) return;
    isDragging.current = false;

    const dy = currentY.current;
    const dt = Date.now() - startTime.current;
    const velocity = dy / dt; // px/ms
    const height = sheetRef.current.offsetHeight;
    const shouldClose = dy > height * threshold || velocity > velocityThreshold;

    if (shouldClose) {
      // animate out then call onClose
      sheetRef.current.style.transition = "transform 0.25s ease-out";
      sheetRef.current.style.transform = `translateY(100%)`;
      setTimeout(onClose, 240);
    } else {
      // snap back
      sheetRef.current.style.transition = "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)";
      sheetRef.current.style.transform = "translateY(0)";
    }
  }, [onClose, threshold, velocityThreshold]);

  return { sheetRef, onTouchStart, onTouchMove, onTouchEnd };
}
