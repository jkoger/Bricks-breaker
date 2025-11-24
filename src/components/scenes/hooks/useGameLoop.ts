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
  isPaused: boolean;
}

export function useGameLoop({
  onTick,
  onKeyDown,
  onKeyUp,
  isPaused,
}: UseGameLoopOptions): void {
  const pausedRef = useRef(isPaused);

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
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      unregisterKeydown();
      unregisterKeyup();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [onTick, onKeyDown, onKeyUp]);
}
