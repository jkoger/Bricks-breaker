import type { GameState } from "../../game/core.ts";
import Vector from "../../game/vector.ts";

import Level from "../level.tsx";
import Lives from "../game-scene/lives.tsx";
import Block from "../game-scene/block.tsx";
import Paddle from "../game-scene/paddle.tsx";
import Ball from "../game-scene/ball.tsx";

interface GameSceneProps {
  game: GameState;
  level: number;
  projectDistance: (distance: number) => number;
  projectVector: (vector: Vector) => Vector;
  viewWidth: number;
  viewHeight: number;
}

export default function GameScene({
  game,
  level,
  projectDistance,
  projectVector,
  viewWidth,
  viewHeight,
}: GameSceneProps) {
  const { blocks, paddle, ball, lives } = game;
  const unit = projectDistance(ball.radius);

  return (
    <svg width={viewWidth} height={viewHeight} className="scene">
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
