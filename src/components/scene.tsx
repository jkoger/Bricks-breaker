import { useReducer } from "react";

import { LEVELS } from "../game/levels";
import { getGameStateFromLevel, type GameState } from "../game/core";
import Vector from "../game/vector";

import Level from "./level";
import Lives from "./lives";
import Block from "./block";
import Paddle from "./paddle";
import Ball from "./ball";

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
  movement: unknown;
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

const reducer = (state: SceneState): SceneState => state;

interface SceneProps {
  containerSize: ContainerSize;
}

export default function Scene({ containerSize }: SceneProps) {
  const [state] = useReducer(reducer, containerSize, getInitialState);
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
