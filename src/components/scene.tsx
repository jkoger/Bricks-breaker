import { useEffect, useReducer } from "react";

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

import StartScreen from "./start-screen";
import LevelCompleted from "./level-completed";
import GameOver from "./game-over";
import GameWon from "./game-won";
import ResumeGame from "./resume-game";
import GameScene from "./game-scene";

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
  level: number;
  game: GameState;
  containerSize: ContainerSize;
  projectDistance: (distance: number) => number;
  projectVector: (vector: Vector) => Vector;
  time: number;
  stopTime: number | undefined;
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

const getInitialState = (containerSize: ContainerSize): SceneState => {
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
    started: false,
    levelCompleted: false,
    gameOver: false,
    gameWon: false,
    showResume,
    level,
    game,
    containerSize,
    projectDistance,
    projectVector,
    time: Date.now(),
    stopTime: undefined,
    movement: undefined,
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

const HANDLER: Record<
  ActionType,
  (state: SceneState, payload?: unknown) => SceneState
> = {
  [ACTION.CONTAINER_SIZE_CHANGE]: (
    state: SceneState,
    containerSize: unknown,
  ) => {
    const size = containerSize as ContainerSize;
    return {
      ...state,
      containerSize: size,
      ...getProjectors(size, state.game.size),
    };
  },
  [ACTION.KEY_DOWN]: (state: SceneState, key: unknown) => {
    if (
      !state.started ||
      state.levelCompleted ||
      state.gameOver ||
      state.gameWon
    )
      return state;
    const keyCode = key as number;
    if (MOVEMENT_KEYS.LEFT.includes(keyCode as 65 | 37)) {
      return { ...state, movement: MOVEMENT.LEFT };
    } else if (MOVEMENT_KEYS.RIGHT.includes(keyCode as 68 | 39)) {
      return { ...state, movement: MOVEMENT.RIGHT };
    }
    return state;
  },
  [ACTION.KEY_UP]: (state: SceneState, key: unknown) => {
    if (
      !state.started ||
      state.levelCompleted ||
      state.gameOver ||
      state.gameWon
    )
      return state;
    const keyCode = key as number;
    const newState = { ...state, movement: undefined };
    if (keyCode === STOP_KEY) {
      if (state.stopTime) {
        return {
          ...newState,
          stopTime: undefined,
          time: state.time + Date.now() - state.stopTime,
        };
      } else {
        return { ...newState, stopTime: Date.now() };
      }
    }
    return newState;
  },
  [ACTION.TICK]: (state: SceneState) => {
    if (
      !state.started ||
      state.stopTime ||
      state.levelCompleted ||
      state.gameOver ||
      state.gameWon
    )
      return state;

    const time = Date.now();
    const newGame = getNewGameState(
      state.game,
      state.movement,
      time - state.time,
    );
    const newState = { ...state, time };
    if (newGame.lives < 1) {
      localStorage.removeItem("gameActive");
      localStorage.removeItem("gameState");
      localStorage.setItem("level", "0");
      return { ...newState, gameOver: true };
    } else if (newGame.blocks.length < 1) {
      const isLastLevel = state.level === LEVELS.length - 1;
      if (isLastLevel) {
        localStorage.removeItem("gameActive");
        localStorage.removeItem("gameState");
        localStorage.setItem("level", "0");
        return { ...newState, gameWon: true };
      }
      saveGameState(state.level, newGame);
      return { ...newState, levelCompleted: true };
    }
    saveGameState(state.level, newGame);
    return { ...newState, game: newGame };
  },
  [ACTION.START_GAME]: (state: SceneState) => {
    localStorage.setItem("level", "0");
    localStorage.setItem("gameActive", "true");
    const game = getGameStateFromLevel(LEVELS[0], 5);
    saveGameState(0, game);
    return {
      ...state,
      started: true,
      showResume: false,
      level: 0,
      game,
      ...getProjectors(state.containerSize, game.size),
      time: Date.now(),
    };
  },
  [ACTION.CONTINUE_LEVEL]: (state: SceneState) => {
    const level =
      state.level === LEVELS.length - 1 ? state.level : state.level + 1;
    localStorage.setItem("level", String(level));
    const game = getGameStateFromLevel(LEVELS[level], state.game.lives);
    saveGameState(level, game);
    return {
      ...state,
      levelCompleted: false,
      level,
      game,
      ...getProjectors(state.containerSize, game.size),
      time: Date.now(),
    };
  },
  [ACTION.RESTART_GAME]: (state: SceneState) => {
    localStorage.setItem("level", "0");
    localStorage.setItem("gameActive", "true");
    const game = getGameStateFromLevel(LEVELS[0], 5);
    saveGameState(0, game);
    return {
      ...state,
      gameOver: false,
      gameWon: false,
      showResume: false,
      level: 0,
      game,
      ...getProjectors(state.containerSize, game.size),
      time: Date.now(),
    };
  },
  [ACTION.CONTINUE_GAME]: (state: SceneState) => {
    localStorage.setItem("gameActive", "true");
    return {
      ...state,
      started: true,
      showResume: false,
      time: Date.now(),
    };
  },
  [ACTION.START_NEW_GAME]: (state: SceneState) => {
    localStorage.setItem("level", "0");
    localStorage.setItem("gameActive", "true");
    const game = getGameStateFromLevel(LEVELS[0], 5);
    saveGameState(0, game);
    return {
      ...state,
      started: true,
      showResume: false,
      gameWon: false,
      level: 0,
      game,
      ...getProjectors(state.containerSize, game.size),
      time: Date.now(),
    };
  },
};

const reducer = (state: SceneState, action: Action): SceneState => {
  const handler = HANDLER[action.type];
  if (!handler) return state;
  return handler(state, action.payload);
};

interface SceneProps {
  containerSize: ContainerSize;
}

export default function Scene({ containerSize }: SceneProps) {
  const [state, dispatch] = useReducer(reducer, containerSize, getInitialState);
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
    game,
  } = state;

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
    const tick = () => act(ACTION.TICK);

    const timerId = setInterval(tick, UPDATE_EVERY);
    const unregisterKeydown = registerListener(
      "keydown",
      onKeyDown as EventListener,
    );
    const unregisterKeyup = registerListener("keyup", onKeyUp as EventListener);
    return () => {
      clearInterval(timerId);
      unregisterKeydown();
      unregisterKeyup();
    };
  }, []);

  const viewWidth = projectDistance(game.size.width);
  const viewHeight = projectDistance(game.size.height);

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

  return (
    <GameScene
      game={game}
      level={level}
      projectDistance={projectDistance}
      projectVector={projectVector}
      viewWidth={viewWidth}
      viewHeight={viewHeight}
    />
  );
}
