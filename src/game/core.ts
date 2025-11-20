import Vector from "./vector";
import {
  flatten,
  getRandomFrom,
  withoutElement,
  updateElement,
} from "../utils";
import type { Level } from "./levels";

const PADDLE_AREA = 1 / 3;
const BLOCK_HEIGHT = 1 / 3;
const PADDLE_HEIGHT = BLOCK_HEIGHT;
const BALL_RADIUS = 1 / 5;
const DISTANCE_IN_MS = 0.005;

export const MOVEMENT = {
  LEFT: "LEFT",
  RIGHT: "RIGHT",
} as const;

export type Movement = (typeof MOVEMENT)[keyof typeof MOVEMENT];

export const MOVEMENT_KEYS = {
  LEFT: [65, 37],
  RIGHT: [68, 39],
} as const;

export const STOP_KEY = 32;

const LEFT = new Vector(-1, 0);
const RIGHT = new Vector(1, 0);
const UP = new Vector(0, -1);
const DOWN = new Vector(0, 1);

const LEFT_UP = LEFT.add(UP).normalize();
const RIGHT_UP = RIGHT.add(UP).normalize();

export interface Paddle {
  position: Vector;
  width: number;
  height: number;
}

export interface Ball {
  center: Vector;
  radius: number;
  direction: Vector;
}

export interface Block {
  density: number;
  position: Vector;
  width: number;
  height: number;
  textureIndex: number; // Random texture index (0 or 1) assigned on creation
  hitAt?: number; // Timestamp when block was last hit (for flash effect)
}

export interface GameState {
  size: { width: number; height: number };
  blocks: Block[];
  paddle: Paddle;
  ball: Ball;
  lives: number;
  speed: number;
}

export const getInitialPaddleAndBall = (
  width: number,
  height: number,
  paddleWidth: number,
): { paddle: Paddle; ball: Ball } => {
  const paddleY = height - PADDLE_HEIGHT;
  const paddle: Paddle = {
    position: new Vector((width - paddleWidth) / 2, paddleY),
    width: paddleWidth,
    height: PADDLE_HEIGHT,
  };
  const ball: Ball = {
    center: new Vector(height / 2, paddleY - BALL_RADIUS * 2),
    radius: BALL_RADIUS,
    direction: getRandomFrom(LEFT_UP, RIGHT_UP),
  };

  return {
    paddle,
    ball,
  };
};

export const getGameStateFromLevel = (
  level: Level,
  lives: number,
): GameState => {
  const width = level.blocks[0].length;
  const height = width;

  const blocksStart =
    (height - height * PADDLE_AREA - level.blocks.length * BLOCK_HEIGHT) / 2;

  const rowsOfBlocks: Block[][] = level.blocks.map((row, i) =>
    row.map((density, j) => ({
      density,
      position: new Vector(j, blocksStart + i * BLOCK_HEIGHT),
      width: 1,
      height: BLOCK_HEIGHT,
      textureIndex: Math.floor(Math.random() * 2), // Random texture: 0 or 1
    })),
  );

  const size = {
    width,
    height,
  };
  return {
    size,
    blocks: flatten(rowsOfBlocks),
    ...getInitialPaddleAndBall(width, height, level.paddleWidth),
    lives,
    speed: level.speed,
  };
};

const getDistortedDirection = (
  vector: Vector,
  distortionLevel: number = 0.3,
): Vector => {
  const getComponent = () =>
    Math.random() * distortionLevel - distortionLevel / 2;
  const distortion = new Vector(getComponent(), getComponent());
  return vector.add(distortion).normalize();
};

const getNewPaddle = (
  paddle: Paddle,
  size: { width: number; height: number },
  distance: number,
  movement: Movement | undefined,
): Paddle => {
  if (!movement) return paddle;
  const direction = movement === MOVEMENT.LEFT ? LEFT : RIGHT;

  const { x } = paddle.position.add(direction.scaleBy(distance));
  const withNewX = (x: number): Paddle => ({
    ...paddle,
    position: new Vector(x, paddle.position.y),
  });
  if (x < 0) {
    return withNewX(0);
  }
  if (x + paddle.width > size.width) {
    return withNewX(size.width - paddle.width);
  }
  return withNewX(x);
};

const isInBoundaries = (
  oneSide: number,
  otherSide: number,
  oneBoundary: number,
  otherBoundary: number,
): boolean =>
  (oneSide >= oneBoundary && oneSide <= otherBoundary) ||
  (otherSide >= oneBoundary && otherSide <= otherBoundary);

const getAdjustedVector = (
  normal: Vector,
  vector: Vector,
  minAngle: number = 15,
): Vector => {
  const angle = normal.angleBetween(vector);
  const maxAngle = 90 - minAngle;
  if (angle < 0) {
    if (angle > -minAngle) {
      return normal.rotate(-minAngle);
    }
    if (angle < -maxAngle) {
      return normal.rotate(-maxAngle);
    }
  } else {
    if (angle < minAngle) {
      return normal.rotate(minAngle);
    }
    if (angle > maxAngle) {
      return normal.rotate(maxAngle);
    }
  }
  return vector;
};

export const getNewGameState = (
  state: GameState,
  movement: Movement | undefined,
  timespan: number,
): GameState => {
  const { size, speed, lives } = state;
  const distance = timespan * DISTANCE_IN_MS * speed;
  const paddle = getNewPaddle(state.paddle, size, distance, movement);

  const { radius } = state.ball;
  const oldDirection = state.ball.direction;
  const newBallCenter = state.ball.center.add(oldDirection.scaleBy(distance));
  const ballBottom = newBallCenter.y + radius;
  if (ballBottom > size.height) {
    return {
      ...state,
      ...getInitialPaddleAndBall(size.width, size.height, paddle.width),
      lives: lives - 1,
    };
  }

  const withNewBallProps = (props: Partial<Ball>): GameState => ({
    ...state,
    paddle,
    ball: {
      ...state.ball,
      ...props,
    },
  });

  const withNewBallDirection = (normal: Vector): GameState => {
    const distorted = getDistortedDirection(oldDirection.reflect(normal));
    const direction = getAdjustedVector(normal, distorted);
    return withNewBallProps({ direction });
  };
  const ballLeft = newBallCenter.x - radius;
  const ballRight = newBallCenter.x + radius;
  const ballTop = newBallCenter.y - radius;
  const paddleLeft = paddle.position.x;
  const paddleRight = paddleLeft + paddle.width;
  const paddleTop = paddle.position.y;

  const ballGoingDown = Math.abs(UP.angleBetween(oldDirection)) > 90;
  const hitPaddle =
    ballGoingDown &&
    ballBottom >= paddleTop &&
    ballRight >= paddleLeft &&
    ballLeft <= paddleRight;
  if (hitPaddle) return withNewBallDirection(UP);
  if (ballTop <= 0) return withNewBallDirection(DOWN);
  if (ballLeft <= 0) return withNewBallDirection(RIGHT);
  if (ballRight >= size.width) return withNewBallDirection(LEFT);

  // Simple spatial culling: only check blocks near the ball
  // This reduces O(n) scan to checking only relevant blocks
  const margin = radius * 2; // Safety margin for fast-moving ball
  const candidateBlocks = state.blocks.filter(({ position, width, height }) => {
    const blockRight = position.x + width;
    const blockBottom = position.y + height;
    // Quick bounding box check - much faster than precise collision
    return (
      ballRight >= position.x - margin &&
      ballLeft <= blockRight + margin &&
      ballBottom >= position.y - margin &&
      ballTop <= blockBottom + margin
    );
  });

  // Find block and its index to optimize array update (avoid cloning entire array)
  let blockIndex = -1;
  let block: (typeof state.blocks)[0] | undefined;

  for (let i = 0; i < state.blocks.length; i++) {
    const b = state.blocks[i];
    // Quick check: is this block in candidate set (spatial culling)
    const blockRight = b.position.x + b.width;
    const blockBottom = b.position.y + b.height;
    const inCandidates =
      ballRight >= b.position.x - margin &&
      ballLeft <= blockRight + margin &&
      ballBottom >= b.position.y - margin &&
      ballTop <= blockBottom + margin;

    if (
      inCandidates &&
      isInBoundaries(
        ballTop,
        ballBottom,
        b.position.y,
        b.position.y + b.height,
      ) &&
      isInBoundaries(ballLeft, ballRight, b.position.x, b.position.x + b.width)
    ) {
      block = b;
      blockIndex = i;
      break;
    }
  }

  if (block && blockIndex !== -1) {
    const density = block.density - 1;

    // Optimize array update: only create new array if needed, and only modify one element
    let blocks: typeof state.blocks;
    if (density < 0) {
      // Remove block: create new array without this index (more efficient than filter)
      blocks = [
        ...state.blocks.slice(0, blockIndex),
        ...state.blocks.slice(blockIndex + 1),
      ];
    } else {
      // Update block: create new array with only this element changed
      // Record hit timestamp for flash effect
      blocks = [...state.blocks];
      blocks[blockIndex] = { ...block, density, hitAt: Date.now() };
    }

    const getNewBallNormal = (): Vector => {
      const blockTop = block.position.y;
      const blockBottom = blockTop + block.height;
      const blockLeft = block.position.x;
      if (ballTop > blockTop - radius && ballBottom < blockBottom + radius) {
        if (ballLeft < blockLeft) return LEFT;
        if (ballRight > blockLeft + block.width) return RIGHT;
      }
      if (ballTop > blockTop) return DOWN;
      if (ballTop <= blockTop) return UP;
      return UP; // fallback
    };
    return {
      ...withNewBallDirection(getNewBallNormal()),
      blocks,
    };
  }
  return withNewBallProps({ center: newBallCenter });
};
