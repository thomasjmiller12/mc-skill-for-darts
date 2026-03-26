"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Hook for requestAnimationFrame-based animations.
 * Returns start/stop controls.
 */
export function useAnimation(
  callback: (elapsed: number, dt: number) => boolean | void
): {
  start: () => void;
  stop: () => void;
  isRunning: React.RefObject<boolean>;
} {
  const rafId = useRef<number>(0);
  const startTime = useRef<number>(0);
  const lastTime = useRef<number>(0);
  const isRunning = useRef(false);

  const stop = useCallback(() => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = 0;
    }
    isRunning.current = false;
  }, []);

  const tick = useCallback(
    (now: number) => {
      if (!isRunning.current) return;

      const elapsed = now - startTime.current;
      const dt = now - lastTime.current;
      lastTime.current = now;

      const shouldContinue = callback(elapsed, dt);
      if (shouldContinue === false) {
        stop();
        return;
      }

      rafId.current = requestAnimationFrame(tick);
    },
    [callback, stop]
  );

  const start = useCallback(() => {
    stop();
    isRunning.current = true;
    startTime.current = performance.now();
    lastTime.current = startTime.current;
    rafId.current = requestAnimationFrame(tick);
  }, [tick, stop]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { start, stop, isRunning };
}
