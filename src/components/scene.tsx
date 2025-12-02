import React, {
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { LEVELS } from "../game/levels";
import { STOP_KEY, type GameState } from "../game/core";
import { GameEngine } from "../game/engine";
import { saveGameState } from "../game/storage";
import {
  type CoreSceneState,
  isGameActive,
  updateState,
  persist,
  getInitialData,
  getMovementFromKeyCode,
  restoreEngineFromStorage,
  getPauseToggleState,
  resetGameToLevel,
  processGameTick,
  getSafeDelta,
  canProcessGameTick,
} from "./scenes/utils/helpers";
import { useProjectors } from "./scenes/hooks/useProjectors";
import { useGameLoop } from "./scenes/hooks/useGameLoop";
import { useViewDimensions } from "./scenes/hooks/useViewDimensions";
import StartScreen from "./scenes/start-screen";
import LevelCompleted from "./scenes/level-completed";
import GameOver from "./scenes/game-over";
import GameWon from "./scenes/game-won";
import ResumeGame from "./scenes/resume-game";
import PauseScreen from "./scenes/pause-screen";
import GameScene from "./scenes/game-scene";

interface ContainerSize {
  width: number;
  height: number;
}

const ACTION = {
  KEY_DOWN: "KEY_DOWN",
  KEY_UP: "KEY_UP",
  TICK: "TICK",
  START_GAME: "START_GAME",
  CONTINUE_LEVEL: "CONTINUE_LEVEL",
  RESTART_GAME: "RESTART_GAME",
  CONTINUE_GAME: "CONTINUE_GAME",
  START_NEW_GAME: "START_NEW_GAME",
} as const;

type ActionType = (typeof ACTION)[keyof typeof ACTION];

interface Action {
  type: ActionType;
  payload?: unknown | [number, boolean?];
}

const createReducer =
  (engineRef: RefObject<GameEngine | null>) =>
  (state: CoreSceneState, action: Action): CoreSceneState => {
    const engine = engineRef.current;
    if (!engine) {
      return state;
    }

    switch (action.type) {
      case ACTION.KEY_DOWN: {
        if (!isGameActive(state)) return state;
        const payload = action.payload;
        const keyCode = Array.isArray(payload)
          ? payload[0]
          : (payload as number);
        const isTouch = Array.isArray(payload) ? payload[1] === true : false;
        const movement = getMovementFromKeyCode(keyCode);
        if (movement) {
          return updateState(state, { movement, isTouchMovement: isTouch });
        }
        return state;
      }

      case ACTION.KEY_UP: {
        if (!isGameActive(state)) return state;
        const keyCode = action.payload as number;
        if (keyCode === STOP_KEY) {
          if (state.isPaused) {
            const restoredData = restoreEngineFromStorage();
            if (restoredData) {
              engineRef.current = new GameEngine(restoredData.game);
            }
            const pauseState = getPauseToggleState(state, restoredData);
            return updateState(state, pauseState);
          } else {
            const snapshot = engine.serialize();
            saveGameState(snapshot);
            return updateState(state, {
              movement: undefined,
              isPaused: true,
              isTouchMovement: false,
            });
          }
        }
        return updateState(state, {
          movement: undefined,
          isTouchMovement: false,
        });
      }

      case ACTION.TICK: {
        if (!canProcessGameTick(state)) return state;
        const delta = getSafeDelta(action.payload);
        const gameStateUpdate = processGameTick(engine, state, delta);
        if (gameStateUpdate) {
          return updateState(state, gameStateUpdate);
        }
        return state;
      }

      case ACTION.START_GAME: {
        resetGameToLevel(engine, 0, 5);
        return updateState(state, {
          started: true,
          showResume: false,
          level: 0,
        });
      }

      case ACTION.CONTINUE_LEVEL: {
        const nextLevel = state.level + 1;
        if (nextLevel >= LEVELS.length) {
          return updateState(state, { levelCompleted: false });
        }
        const currentGame = engine.getState();
        resetGameToLevel(engine, nextLevel, currentGame.lives);
        return updateState(state, {
          levelCompleted: false,
          level: nextLevel,
        });
      }

      case ACTION.RESTART_GAME: {
        resetGameToLevel(engine, 0, 5);
        return updateState(state, {
          gameOver: false,
          gameWon: false,
          showResume: false,
          level: 0,
        });
      }

      case ACTION.CONTINUE_GAME: {
        const restored = restoreEngineFromStorage();
        if (restored) {
          engineRef.current = new GameEngine(restored.game);
          return updateState(state, {
            started: true,
            showResume: false,
            level: restored.level,
          });
        }
        return updateState(state, {
          started: true,
          showResume: false,
        });
      }

      case ACTION.START_NEW_GAME: {
        resetGameToLevel(engine, 0, 5);
        return updateState(state, {
          started: true,
          showResume: false,
          gameWon: false,
          level: 0,
        });
      }

      default:
        return state;
    }
  };

interface SceneProps {
  containerSize: ContainerSize;
}

export default function Scene({ containerSize }: SceneProps) {
  const engineRef = useRef<GameEngine | null>(null);
  const reducer = useMemo(() => {
    return createReducer(engineRef);
  }, []);
  const [state, dispatch] = useReducer(
    reducer,
    containerSize,
    (size: ContainerSize) => {
      const { state: initialState, game } = getInitialData(size);
      engineRef.current = new GameEngine(game);
      return initialState;
    },
  );
  const previousStateRef = useRef<CoreSceneState>(state);
  const previousGameRef = useRef<GameState | null>(null);

  const act = useCallback(
    (type: ActionType, payload?: unknown) => dispatch({ type, payload }),
    [dispatch],
  );
  const {
    started,
    levelCompleted,
    gameOver,
    gameWon,
    showResume,
    level,
    isPaused,
  } = state;

  const currentGame = engineRef.current?.getState();
  if (!currentGame) {
    throw new Error("Game engine not initialized");
  }
  const gameSize = currentGame.size;
  const { projectDistance, projectVector } = useProjectors(
    containerSize,
    gameSize,
  );

  useEffect(() => {
    if (engineRef.current) {
      const currentGameState = engineRef.current.getState();
      const previousGameState = previousGameRef.current;

      if (
        previousGameState &&
        currentGameState.lives !== previousGameState.lives &&
        started &&
        !isPaused
      ) {
        const snapshot = engineRef.current.serialize();
        saveGameState(snapshot);
      }

      persist(state, engineRef.current, previousStateRef.current);
      previousStateRef.current = state;
      previousGameRef.current = currentGameState;
    }
  }, [state, started, isPaused]);

  const handleTick = useCallback(
    (delta: number) => act(ACTION.TICK, delta),
    [act],
  );
  const handleKeyDown = useCallback(
    (keyCode: number) => act(ACTION.KEY_DOWN, keyCode),
    [act],
  );
  const handleKeyUp = useCallback(
    (keyCode: number) => act(ACTION.KEY_UP, keyCode),
    [act],
  );

  const touchStartRef = useRef<{
    x: number;
    y: number;
    time: number;
    containerX: number;
  } | null>(null);
  const touchContainerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const currentMovementRef = useRef<"LEFT" | "RIGHT" | null>(null);
  const lastTapRef = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );
  const movementAnimationRef = useRef<number | null>(null);

  const startRapidMovement = useCallback(
    (
      direction: "LEFT" | "RIGHT",
      actionFn: (type: ActionType, payload?: unknown) => void,
    ) => {
      if (movementAnimationRef.current !== null) {
        cancelAnimationFrame(movementAnimationRef.current);
      }

      const keyCode = direction === "LEFT" ? 37 : 39;

      const animate = () => {
        if (currentMovementRef.current === direction && isGameActive(state)) {
          actionFn(ACTION.KEY_DOWN, keyCode);
          movementAnimationRef.current = requestAnimationFrame(animate);
        } else {
          movementAnimationRef.current = null;
        }
      };

      movementAnimationRef.current = requestAnimationFrame(animate);
    },
    [state],
  );

  const handleTouchStart = useCallback(
    (event: TouchEvent | MouseEvent) => {
      if (!isGameActive(state)) return;

      const target = event.target as HTMLElement;
      if (target.closest(".button-container")) {
        return;
      }

      if ("touches" in event && event.touches.length > 0) {
        event.preventDefault();
        event.stopPropagation();

        const touch = event.touches[0];
        const container = touchContainerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          touchStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now(),
            containerX: touch.clientX - rect.left,
          };
          isDraggingRef.current = false;
        }
      } else if (event.type === "mousedown") {
        act(ACTION.KEY_UP, STOP_KEY);
      }
    },
    [act, state],
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent | MouseEvent) => {
      if (!isGameActive(state) || !touchStartRef.current) return;

      const target = event.target as HTMLElement;
      if (target.closest(".button-container")) {
        return;
      }

      if ("touches" in event && event.touches.length > 0) {
        event.preventDefault();
        event.stopPropagation();

        const touch = event.touches[0];
        const container = touchContainerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const currentX = touch.clientX - rect.left;
          const deltaX = currentX - touchStartRef.current.containerX;

          if (Math.abs(deltaX) > 2) {
            isDraggingRef.current = true;
          }

          const game = engineRef.current?.getState();
          const unitOnScreen = projectDistance(1);
          if (game && unitOnScreen > 0) {
            const targetCenterX = currentX / unitOnScreen;
            engineRef.current?.setPaddleCenterX(targetCenterX);

            if (currentMovementRef.current === "LEFT") {
              act(ACTION.KEY_UP, 37);
            } else if (currentMovementRef.current === "RIGHT") {
              act(ACTION.KEY_UP, 39);
            }

            if (movementAnimationRef.current !== null) {
              cancelAnimationFrame(movementAnimationRef.current);
              movementAnimationRef.current = null;
            }

            currentMovementRef.current = null;
            return;
          }

          const movementThreshold = 5;
          let newMovement: "LEFT" | "RIGHT" | null = null;

          if (deltaX < -movementThreshold) {
            newMovement = "LEFT";
          } else if (deltaX > movementThreshold) {
            newMovement = "RIGHT";
          }

          if (newMovement !== currentMovementRef.current) {
            if (currentMovementRef.current === "LEFT") {
              act(ACTION.KEY_UP, 37);
            } else if (currentMovementRef.current === "RIGHT") {
              act(ACTION.KEY_UP, 39);
            }

            if (movementAnimationRef.current !== null) {
              cancelAnimationFrame(movementAnimationRef.current);
              movementAnimationRef.current = null;
            }

            if (newMovement === "LEFT") {
              act(ACTION.KEY_DOWN, [37, true]);
              startRapidMovement("LEFT", act);
            } else if (newMovement === "RIGHT") {
              act(ACTION.KEY_DOWN, [39, true]);
              startRapidMovement("RIGHT", act);
            }

            currentMovementRef.current = newMovement;
          }
        }
      }
    },
    [act, projectDistance, state],
  );

  const handleTouchEnd = useCallback(
    (event: TouchEvent | MouseEvent) => {
      if (!touchStartRef.current) return;

      const target = event.target as HTMLElement;
      if (target.closest(".button-container")) {
        touchStartRef.current = null;
        isDraggingRef.current = false;
        return;
      }

      if ("changedTouches" in event && event.changedTouches.length > 0) {
        event.preventDefault();
        event.stopPropagation();

        const touchEnd = event.changedTouches[0];
        const deltaX = Math.abs(touchEnd.clientX - touchStartRef.current.x);
        const deltaY = Math.abs(touchEnd.clientY - touchStartRef.current.y);
        const deltaTime = Date.now() - touchStartRef.current.time;
        const isTap =
          !isDraggingRef.current &&
          deltaX < 20 &&
          deltaY < 20 &&
          deltaTime < 300;

        if (currentMovementRef.current === "LEFT") {
          act(ACTION.KEY_UP, 37);
        } else if (currentMovementRef.current === "RIGHT") {
          act(ACTION.KEY_UP, 39);
        }

        if (movementAnimationRef.current !== null) {
          cancelAnimationFrame(movementAnimationRef.current);
          movementAnimationRef.current = null;
        }

        currentMovementRef.current = null;

        if (isTap && isGameActive(state)) {
          const now = Date.now();
          const currentTap = {
            x: touchEnd.clientX,
            y: touchEnd.clientY,
            time: now,
          };

          if (lastTapRef.current) {
            const timeSinceLastTap = now - lastTapRef.current.time;
            const distanceX = Math.abs(currentTap.x - lastTapRef.current.x);
            const distanceY = Math.abs(currentTap.y - lastTapRef.current.y);
            const isDoubleTap =
              timeSinceLastTap < 400 && distanceX < 50 && distanceY < 50;

            if (isDoubleTap) {
              act(ACTION.KEY_UP, STOP_KEY);
              lastTapRef.current = null;
            } else {
              lastTapRef.current = currentTap;
            }
          } else {
            lastTapRef.current = currentTap;
          }
        } else {
          lastTapRef.current = null;
        }

        touchStartRef.current = null;
        isDraggingRef.current = false;
      }
    },
    [act, state],
  );

  useGameLoop({
    onTick: handleTick,
    onKeyDown: handleKeyDown,
    onKeyUp: handleKeyUp,
    isPaused,
  });

  const { width: viewWidth, height: viewHeight } = useViewDimensions(
    currentGame,
    projectDistance,
  );

  const handleMouseDown = useCallback(() => {
    act(ACTION.KEY_UP, STOP_KEY);
  }, [act]);

  useEffect(() => {
    const container = touchContainerRef.current;
    if (!container) return;

    const touchOptions = { passive: false, capture: false };

    container.addEventListener(
      "touchstart",
      handleTouchStart as EventListener,
      touchOptions,
    );
    container.addEventListener(
      "touchmove",
      handleTouchMove as EventListener,
      touchOptions,
    );
    container.addEventListener(
      "touchend",
      handleTouchEnd as EventListener,
      touchOptions,
    );
    container.addEventListener(
      "touchcancel",
      handleTouchEnd as EventListener,
      touchOptions,
    );

    return () => {
      container.removeEventListener(
        "touchstart",
        handleTouchStart as EventListener,
      );
      container.removeEventListener(
        "touchmove",
        handleTouchMove as EventListener,
      );
      container.removeEventListener(
        "touchend",
        handleTouchEnd as EventListener,
      );
      container.removeEventListener(
        "touchcancel",
        handleTouchEnd as EventListener,
      );
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const renderScreen = <T extends Record<string, unknown>>(
    ScreenComponent: React.ComponentType<{ width: number; height: number } & T>,
    props: T,
  ) => <ScreenComponent width={viewWidth} height={viewHeight} {...props} />;

  if (showResume) {
    return renderScreen(ResumeGame, {
      onContinue: () => act(ACTION.CONTINUE_GAME),
      onStartNew: () => act(ACTION.START_GAME),
    });
  }

  if (!started) {
    return renderScreen(StartScreen, {
      onStart: () => act(ACTION.START_GAME),
    });
  }

  if (gameWon) {
    return renderScreen(GameWon, {
      onNewGame: () => act(ACTION.START_NEW_GAME),
    });
  }

  if (gameOver) {
    return renderScreen(GameOver, {
      onRestart: () => act(ACTION.RESTART_GAME),
    });
  }

  if (levelCompleted) {
    return renderScreen(LevelCompleted, {
      level: level + 1,
      onContinue: () => act(ACTION.CONTINUE_LEVEL),
    });
  }

  const borderWidth = 2;
  const containerWidth = viewWidth + borderWidth * 2;
  const containerHeight = viewHeight + borderWidth * 2;

  return (
    <div
      ref={touchContainerRef}
      style={{
        position: "relative",
        width: containerWidth,
        height: containerHeight,
        touchAction: "none",
      }}
      onMouseDown={handleMouseDown}
    >
      {engineRef.current && (
        <>
          <GameScene
            engineRef={engineRef}
            level={level}
            projectDistance={projectDistance}
            projectVector={projectVector}
            viewWidth={viewWidth}
            viewHeight={viewHeight}
          />
        </>
      )}
      {isPaused && (
        <PauseScreen
          width={containerWidth}
          height={containerHeight}
          onResume={() => act(ACTION.KEY_UP, STOP_KEY)}
        />
      )}
    </div>
  );
}
