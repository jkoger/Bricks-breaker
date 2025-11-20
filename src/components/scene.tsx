import { useEffect, useMemo, useReducer, useRef } from "react";

import { LEVELS } from "../game/levels";
import {
  MOVEMENT,
  MOVEMENT_KEYS,
  STOP_KEY,
  getNewGameState,
  getGameStateFromLevel,
  type GameState,
  type Movement,
} from "../game/core";
import { registerListener } from "../utils";
import Vector from "../game/vector";

import StartScreen from "./scenes/start-screen";
import LevelCompleted from "./scenes/level-completed";
import GameOver from "./scenes/game-over";
import GameWon from "./scenes/game-won";
import ResumeGame from "./scenes/resume-game";
import PauseScreen from "./scenes/pause-screen";
import GameScene from "./scenes/game-scene";

const UPDATE_EVERY = 1000 / 60;

interface ContainerSize {
  width: number;
  height: number;
}

interface Projectors {
  projectDistance: (distance: number) => number;
  projectVector: (vector: Vector) => Vector;
}

interface SceneState {
  started: boolean;
  levelCompleted: boolean;
  gameOver: boolean;
  gameWon: boolean;
  showResume: boolean;
  isPaused: boolean;
  level: number;
  containerSize: ContainerSize;
  projectDistance: (distance: number) => number;
  projectVector: (vector: Vector) => Vector;
  movement: Movement | undefined;
}

const getInitialLevel = (): number => {
  const inState = localStorage.getItem("level");
  return inState ? parseInt(inState, 10) : 0;
};

const hasActiveGame = (): boolean => {
  const gameActive = localStorage.getItem("gameActive");
  const level = getInitialLevel();
  return gameActive === "true" && level >= 0;
};

const saveGameState = (level: number, game: GameState): void => {
  const gameStateData = {
    level,
    game: {
      ...game,
      blocks: game.blocks.map((block) => ({
        ...block,
        position: { x: block.position.x, y: block.position.y },
      })),
      paddle: {
        ...game.paddle,
        position: { x: game.paddle.position.x, y: game.paddle.position.y },
      },
      ball: {
        ...game.ball,
        center: { x: game.ball.center.x, y: game.ball.center.y },
        direction: { x: game.ball.direction.x, y: game.ball.direction.y },
      },
    },
  };
  localStorage.setItem("gameState", JSON.stringify(gameStateData));
};

const restoreGameState = (): { level: number; game: GameState } | null => {
  const saved = localStorage.getItem("gameState");
  if (!saved) return null;
  try {
    const data = JSON.parse(saved);
    return {
      level: data.level,
      game: {
        ...data.game,
        blocks: data.game.blocks.map((block: any) => ({
          ...block,
          position: new Vector(block.position.x, block.position.y),
          // Ensure textureIndex exists (for old saved games)
          textureIndex:
            block.textureIndex !== undefined
              ? block.textureIndex
              : Math.floor(Math.random() * 2),
        })),
        paddle: {
          ...data.game.paddle,
          position: new Vector(
            data.game.paddle.position.x,
            data.game.paddle.position.y,
          ),
        },
        ball: {
          ...data.game.ball,
          center: new Vector(data.game.ball.center.x, data.game.ball.center.y),
          direction: new Vector(
            data.game.ball.direction.x,
            data.game.ball.direction.y,
          ),
        },
      },
    };
  } catch {
    return null;
  }
};

const getProjectors = (
  containerSize: ContainerSize,
  gameSize: { width: number; height: number },
): Projectors => {
  const widthRatio = containerSize.width / gameSize.width;
  const heightRatio = containerSize.height / gameSize.height;
  const unitOnScreen = Math.min(widthRatio, heightRatio);

  return {
    projectDistance: (distance: number) => distance * unitOnScreen,
    projectVector: (vector: Vector) => vector.scaleBy(unitOnScreen),
  };
};

interface InitialData {
  state: SceneState;
  game: GameState;
}

const getInitialData = (containerSize: ContainerSize): InitialData => {
  const showResume = hasActiveGame();
  let level: number;
  let game: GameState;

  if (showResume) {
    const restored = restoreGameState();
    if (restored) {
      level = restored.level;
      game = restored.game;
    } else {
      level = getInitialLevel();
      game = getGameStateFromLevel(LEVELS[level], 5);
    }
  } else {
    level = getInitialLevel();
    game = getGameStateFromLevel(LEVELS[level], 5);
  }

  const { projectDistance, projectVector } = getProjectors(
    containerSize,
    game.size,
  );
  return {
    state: {
      started: false,
      levelCompleted: false,
      gameOver: false,
      gameWon: false,
      showResume,
      isPaused: false,
      level,
      containerSize,
      projectDistance,
      projectVector,
      movement: undefined,
    },
    game,
  };
};

const ACTION = {
  CONTAINER_SIZE_CHANGE: "CONTAINER_SIZE_CHANGE",
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
  (gameRef: React.MutableRefObject<GameState>) =>
  (state: SceneState, action: Action): SceneState => {
    switch (action.type) {
      case ACTION.CONTAINER_SIZE_CHANGE: {
        const size = action.payload as ContainerSize;
        const gameSize = gameRef.current.size;
        return {
          ...state,
          containerSize: size,
          ...getProjectors(size, gameSize),
        };
      }
      case ACTION.KEY_DOWN: {
        if (
          !state.started ||
          state.levelCompleted ||
          state.gameOver ||
          state.gameWon
        )
          return state;
        const keyCode = action.payload as number;
        if (MOVEMENT_KEYS.LEFT.includes(keyCode as 65 | 37)) {
          return { ...state, movement: MOVEMENT.LEFT };
        }
        if (MOVEMENT_KEYS.RIGHT.includes(keyCode as 68 | 39)) {
          return { ...state, movement: MOVEMENT.RIGHT };
        }
        return state;
      }
      case ACTION.KEY_UP: {
        if (
          !state.started ||
          state.levelCompleted ||
          state.gameOver ||
          state.gameWon
        )
          return state;
        const keyCode = action.payload as number;
        if (keyCode === STOP_KEY) {
          return { ...state, movement: undefined, isPaused: !state.isPaused };
        }
        return { ...state, movement: undefined };
      }
      case ACTION.TICK: {
        if (
          !state.started ||
          state.isPaused ||
          state.levelCompleted ||
          state.gameOver ||
          state.gameWon
        )
          return state;
        const delta =
          typeof action.payload === "number" && !Number.isNaN(action.payload)
            ? (action.payload as number)
            : UPDATE_EVERY;
        const newGame = getNewGameState(gameRef.current, state.movement, delta);
        gameRef.current = newGame;
        if (newGame.lives < 1) {
          localStorage.removeItem("gameActive");
          localStorage.removeItem("gameState");
          localStorage.setItem("level", "0");
          return { ...state, gameOver: true };
        }
        if (newGame.blocks.length < 1) {
          const isLastLevel = state.level === LEVELS.length - 1;
          if (isLastLevel) {
            localStorage.removeItem("gameActive");
            localStorage.removeItem("gameState");
            localStorage.setItem("level", "0");
            return { ...state, gameWon: true };
          }
          saveGameState(state.level, newGame);
          return { ...state, levelCompleted: true };
        }
        return state;
      }
      case ACTION.START_GAME: {
        localStorage.setItem("level", "0");
        localStorage.setItem("gameActive", "true");
        const game = getGameStateFromLevel(LEVELS[0], 5);
        gameRef.current = game;
        saveGameState(0, game);
        return {
          ...state,
          started: true,
          showResume: false,
          level: 0,
          ...getProjectors(state.containerSize, game.size),
        };
      }
      case ACTION.CONTINUE_LEVEL: {
        const level =
          state.level === LEVELS.length - 1 ? state.level : state.level + 1;
        localStorage.setItem("level", String(level));
        const game = getGameStateFromLevel(
          LEVELS[level],
          gameRef.current.lives,
        );
        gameRef.current = game;
        saveGameState(level, game);
        return {
          ...state,
          levelCompleted: false,
          level,
          ...getProjectors(state.containerSize, game.size),
        };
      }
      case ACTION.RESTART_GAME: {
        localStorage.setItem("level", "0");
        localStorage.setItem("gameActive", "true");
        const game = getGameStateFromLevel(LEVELS[0], 5);
        gameRef.current = game;
        saveGameState(0, game);
        return {
          ...state,
          gameOver: false,
          gameWon: false,
          showResume: false,
          level: 0,
          ...getProjectors(state.containerSize, game.size),
        };
      }
      case ACTION.CONTINUE_GAME: {
        localStorage.setItem("gameActive", "true");
        return {
          ...state,
          started: true,
          showResume: false,
        };
      }
      case ACTION.START_NEW_GAME: {
        localStorage.setItem("level", "0");
        localStorage.setItem("gameActive", "true");
        const game = getGameStateFromLevel(LEVELS[0], 5);
        gameRef.current = game;
        saveGameState(0, game);
        return {
          ...state,
          started: true,
          showResume: false,
          gameWon: false,
          level: 0,
          ...getProjectors(state.containerSize, game.size),
        };
      }
      default:
        return state;
    }
  };

interface SceneProps {
  containerSize: ContainerSize;
}

export default function Scene({ containerSize }: SceneProps) {
  const gameRef = useRef<GameState | null>(null);
  const reducer = useMemo(
    () => createReducer(gameRef as React.MutableRefObject<GameState>),
    [],
  );
  const [state, dispatch] = useReducer(
    reducer,
    containerSize,
    (size: ContainerSize) => {
      const { state: initialState, game } = getInitialData(size);
      gameRef.current = game;
      return initialState;
    },
  );
  const resolvedGameRef = gameRef as React.MutableRefObject<GameState>;
  const act = (type: ActionType, payload?: unknown) =>
    dispatch({ type, payload });
  const {
    started,
    levelCompleted,
    gameOver,
    gameWon,
    showResume,
    projectDistance,
    projectVector,
    level,
    isPaused,
  } = state;

  const pausedRef = useRef(isPaused);
  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    act(ACTION.CONTAINER_SIZE_CHANGE, containerSize);
  }, [containerSize]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const keyCode = event.which || event.keyCode;
      act(ACTION.KEY_DOWN, keyCode);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const keyCode = event.which || event.keyCode;
      act(ACTION.KEY_UP, keyCode);
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
        act(ACTION.TICK, UPDATE_EVERY);
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
      onKeyDown as EventListener,
    );
    const unregisterKeyup = registerListener("keyup", onKeyUp as EventListener);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      unregisterKeydown();
      unregisterKeyup();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const currentGame = resolvedGameRef.current;
  const viewWidth = projectDistance(currentGame.size.width);
  const viewHeight = projectDistance(currentGame.size.height);

  if (showResume) {
    return (
      <ResumeGame
        width={viewWidth}
        height={viewHeight}
        onContinue={() => act(ACTION.CONTINUE_GAME)}
        onStartNew={() => act(ACTION.START_NEW_GAME)}
      />
    );
  }

  if (!started) {
    return (
      <StartScreen
        width={viewWidth}
        height={viewHeight}
        onStart={() => act(ACTION.START_GAME)}
      />
    );
  }

  if (gameWon) {
    return (
      <GameWon
        width={viewWidth}
        height={viewHeight}
        onNewGame={() => act(ACTION.START_NEW_GAME)}
      />
    );
  }

  if (gameOver) {
    return (
      <GameOver
        width={viewWidth}
        height={viewHeight}
        onRestart={() => act(ACTION.RESTART_GAME)}
      />
    );
  }

  if (levelCompleted) {
    return (
      <LevelCompleted
        width={viewWidth}
        height={viewHeight}
        level={level + 1}
        onContinue={() => act(ACTION.CONTINUE_LEVEL)}
      />
    );
  }

  // Account for canvas border (2px on each side = 4px total)
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
      <GameScene
        gameRef={resolvedGameRef}
        level={level}
        projectDistance={projectDistance}
        projectVector={projectVector}
        viewWidth={viewWidth}
        viewHeight={viewHeight}
      />
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
