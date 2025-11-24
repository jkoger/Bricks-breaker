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
  payload?: unknown;
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
        const keyCode = action.payload as number;
        const movement = getMovementFromKeyCode(keyCode);
        if (movement) {
          return updateState(state, { movement });
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
            });
          }
        }
        return updateState(state, { movement: undefined });
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
      style={{
        position: "relative",
        width: containerWidth,
        height: containerHeight,
      }}
    >
      {engineRef.current && (
        <GameScene
          engineRef={engineRef}
          level={level}
          projectDistance={projectDistance}
          projectVector={projectVector}
          viewWidth={viewWidth}
          viewHeight={viewHeight}
        />
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
