"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const AUTO_ADVANCE_MS = 4000;
const RESUME_AFTER_MANUAL_MS = 6000;

// Shared by components/home/Gallery.tsx and components/home/HeroCarousel.tsx
// so both auto-advancing carousels behave identically: auto-advances on a
// timer; a manual arrow click jumps immediately and pauses the timer
// briefly so a manual choice doesn't get instantly overridden by the next
// auto-tick.
export function useCarousel(itemCount: number) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startAutoAdvance = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (itemCount <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % itemCount);
    }, AUTO_ADVANCE_MS);
  }, [itemCount]);

  useEffect(() => {
    startAutoAdvance();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, [startAutoAdvance]);

  function handleManualNav(direction: 1 | -1) {
    setIndex((i) => (i + direction + itemCount) % itemCount);
    if (timerRef.current) clearInterval(timerRef.current);
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(startAutoAdvance, RESUME_AFTER_MANUAL_MS);
  }

  return { index, handleManualNav };
}
