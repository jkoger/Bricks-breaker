import { useEffect, useReducer } from "react";

import { LEVELS } from "../game/levels";
import {
  MOVEMENT,
  getNewGameState,
  getGameStateFromLevel,
  type GameState,
  type Movement,
} from "../game/core";
import { registerListener } from "../utils";
import Vector from "../game/vector";

import Level from "./level";
import Lives from "./lives";
import Block from "./block";
import Paddle from "./paddle";
import Ball from "./ball";

const MOVEMENT_KEYS = {
  LEFT: [65, 37],
  RIGHT: [68, 39],
} as const;

const STOP_KEY = 32;

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
  const level = getInitialLevel();
  const game = getGameStateFromLevel(LEVELS[level]);
  const { projectDistance, projectVector } = getProjectors(
    containerSize,
    game.size,
  );
  return {
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
    const keyCode = key as number;
    if (MOVEMENT_KEYS.LEFT.includes(keyCode as 65 | 37)) {
      return { ...state, movement: MOVEMENT.LEFT };
    } else if (MOVEMENT_KEYS.RIGHT.includes(keyCode as 68 | 39)) {
      return { ...state, movement: MOVEMENT.RIGHT };
    }
    return state;
  },
  [ACTION.KEY_UP]: (state: SceneState, key: unknown) => {
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
    if (state.stopTime) return state;

    const time = Date.now();
    const newGame = getNewGameState(
      state.game,
      state.movement,
      time - state.time,
    );
    const newState = { ...state, time };
    if (newGame.lives < 1) {
      return { ...newState, game: getGameStateFromLevel(LEVELS[state.level]) };
    } else if (newGame.blocks.length < 1) {
      const level =
        state.level === LEVELS.length - 1 ? state.level : state.level + 1;
      localStorage.setItem("level", String(level));
      const game = getGameStateFromLevel(LEVELS[level]);
      return {
        ...newState,
        level,
        game,
        ...getProjectors(state.containerSize, game.size),
      };
    }
    return { ...newState, game: newGame };
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
    projectDistance,
    projectVector,
    level,
    game: {
      blocks,
      paddle,
      ball,
      size: { width, height },
      lives,
    },
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

  const viewWidth = projectDistance(width);
  const unit = projectDistance(ball.radius);
  return (
    <svg width={viewWidth} height={projectDistance(height)} className="scene">
      <Lives lives={lives} unit={unit} />
      <Level unit={unit} level={level + 1} containerWidth={viewWidth} />
      {blocks.map(({ density, position, width, height }) => (
        <Block
          density={density}
          key={`${position.x}-${position.y}`}
          width={projectDistance(width)}
          height={projectDistance(height)}
          {...projectVector(position)}
        />
      ))}
      <Paddle
        width={projectDistance(paddle.width)}
        height={projectDistance(paddle.height)}
        {...projectVector(paddle.position)}
      />
      <Ball {...projectVector(ball.center)} radius={unit} />
    </svg>
  );
}
