import { useEffect, useRef } from "react";
import { registerListener } from "../../../utils";

const UPDATE_EVERY = 1000 / 60;

function getKeyCode(event: KeyboardEvent): number {
  if (event.code) {
    const codeMap: Record<string, number> = {
      KeyA: 65,
      ArrowLeft: 37,
      KeyD: 68,
      ArrowRight: 39,
      Space: 32,
    };
    if (codeMap[event.code]) {
      return codeMap[event.code];
    }
  }
  return event.which || event.keyCode || 0;
}

interface UseGameLoopOptions {
  onTick: (delta: number) => void;
  onKeyDown: (keyCode: number) => void;
  onKeyUp: (keyCode: number) => void;
  onTouchMove?: (movement: "LEFT" | "RIGHT" | null) => void;
  isPaused: boolean;
}

export function useGameLoop({
  onTick,
  onKeyDown,
  onKeyUp,
  onTouchMove,
  isPaused,
}: UseGameLoopOptions): void {
  const pausedRef = useRef(isPaused);
  const touchStartXRef = useRef<number | null>(null);
  const touchCurrentXRef = useRef<number | null>(null);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const keyCode = getKeyCode(event);
      onKeyDown(keyCode);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const keyCode = getKeyCode(event);
      onKeyUp(keyCode);
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        touchStartXRef.current = event.touches[0].clientX;
        touchCurrentXRef.current = event.touches[0].clientX;
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 0 && touchStartXRef.current !== null) {
        touchCurrentXRef.current = event.touches[0].clientX;
        const deltaX = touchCurrentXRef.current - touchStartXRef.current;
        const threshold = 10;

        if (Math.abs(deltaX) > threshold && onTouchMove) {
          if (deltaX > 0) {
            onTouchMove("RIGHT");
          } else {
            onTouchMove("LEFT");
          }
        } else if (onTouchMove) {
          onTouchMove(null);
        }

        if (!pausedRef.current) {
          event.preventDefault();
        }
      }
    };

    const handleTouchEnd = () => {
      if (onTouchMove) {
        onTouchMove(null);
      }
      touchStartXRef.current = null;
      touchCurrentXRef.current = null;
    };

    let animationFrameId: number | null = null;
    let lastTimestamp: number | null = null;
    let accumulator = 0;
    let hiddenPause = false;

    const tick = (timestamp: number) => {
      if (lastTimestamp === null) {
        lastTimestamp = timestamp;
      }
      const delta = Math.min(timestamp - lastTimestamp, 250);
      lastTimestamp = timestamp;

      if (pausedRef.current || hiddenPause) {
        animationFrameId = requestAnimationFrame(tick);
        return;
      }

      accumulator += delta;
      while (accumulator >= UPDATE_EVERY) {
        onTick(UPDATE_EVERY);
        accumulator -= UPDATE_EVERY;
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    const handleVisibilityChange = () => {
      hiddenPause = document.hidden;
      if (!hiddenPause) {
        lastTimestamp = null;
      }
    };

    animationFrameId = requestAnimationFrame(tick);
    const unregisterKeydown = registerListener(
      "keydown",
      handleKeyDown as EventListener,
    );
    const unregisterKeyup = registerListener(
      "keyup",
      handleKeyUp as EventListener,
    );

    const touchOptions = { passive: false };
    document.addEventListener("touchstart", handleTouchStart, touchOptions);
    document.addEventListener("touchmove", handleTouchMove, touchOptions);
    document.addEventListener("touchend", handleTouchEnd, touchOptions);
    document.addEventListener("touchcancel", handleTouchEnd, touchOptions);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      unregisterKeydown();
      unregisterKeyup();
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchEnd);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [onTick, onKeyDown, onKeyUp, onTouchMove]);
}
