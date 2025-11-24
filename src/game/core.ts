import Vector from "./vector";
import type { Level } from "./levels";
import { SeededRNG } from "./rng";
import { BlockGrid } from "./blockGrid";

export { BlockGrid } from "./blockGrid";

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
  textureIndex: number;
  hitAt?: number;
}

export interface GameState {
  size: { width: number; height: number };
  blockGrid: BlockGrid;
  paddle: Paddle;
  ball: Ball;
  lives: number;
  speed: number;
  seed: number;
}

export const getInitialPaddleAndBall = (
  width: number,
  height: number,
  paddleWidth: number,
  rng: SeededRNG,
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
    direction: rng.choose([LEFT_UP, RIGHT_UP]),
  };

  return {
    paddle,
    ball,
  };
};

export const getGameStateFromLevel = (
  level: Level,
  lives: number,
  seed?: number,
): GameState => {
  const gameSeed = seed ?? SeededRNG.generateSeed();
  const rng = new SeededRNG(gameSeed);

  const width = level.blocks[0].length;
  const height = width;

  const blocksStart =
    (height - height * PADDLE_AREA - level.blocks.length * BLOCK_HEIGHT) / 2;

  const size = {
    width,
    height,
  };

  const blockGrid = new BlockGrid(
    level.blocks.length,
    level.blocks[0].length,
    blocksStart,
  );

  level.blocks.forEach((row, i) => {
    row.forEach((density, j) => {
      const finalDensity = density === 0 ? 1 : density;
      if (finalDensity > 0) {
        blockGrid.setBlock(i, j, {
          density: finalDensity,
          position: new Vector(j, blocksStart + i * BLOCK_HEIGHT),
          width: 1,
          height: BLOCK_HEIGHT,
          textureIndex: rng.nextInt(0, 2),
        });
      }
    });
  });

  return {
    size,
    blockGrid,
    ...getInitialPaddleAndBall(width, height, level.paddleWidth, rng),
    lives,
    speed: level.speed,
    seed: gameSeed,
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
  if (!oldDirection) {
    const defaultDirection = new Vector(0, -1).normalize();
    return {
      ...state,
      ball: {
        ...state.ball,
        direction: defaultDirection,
      },
    };
  }
  const newBallCenter = state.ball.center.add(oldDirection.scaleBy(distance));
  const ballBottom = newBallCenter.y + radius;
  if (ballBottom > size.height) {
    const rng = new SeededRNG(state.seed);
    const INITIAL_LIVES = 5;
    const ballsLost = INITIAL_LIVES - lives;
    const baseOffset = 1000;
    const offsetPerRespawn = 100;
    for (let i = 0; i < baseOffset + ballsLost * offsetPerRespawn; i++) {
      rng.next();
    }
    return {
      ...state,
      ...getInitialPaddleAndBall(size.width, size.height, paddle.width, rng),
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

  const cells = state.blockGrid.getCellsForBall(newBallCenter, radius);

  for (const { row, col } of cells) {
    const block = state.blockGrid.getBlock(row, col);
    if (!block || block.density <= 0) {
      continue;
    }

    const blockTop = block.position.y;
    const blockBottom = blockTop + block.height;
    const blockLeft = block.position.x;
    const blockRight = blockLeft + block.width;

    if (
      isInBoundaries(ballTop, ballBottom, blockTop, blockBottom) &&
      isInBoundaries(ballLeft, ballRight, blockLeft, blockRight)
    ) {
      const density = block.density - 1;

      if (density <= 0) {
        state.blockGrid.setBlockDensityToZero(row, col);
      } else {
        state.blockGrid.updateBlockDensity(row, col, density, Date.now());
      }

      const getNewBallNormal = (): Vector => {
        if (ballTop > blockTop - radius && ballBottom < blockBottom + radius) {
          if (ballLeft < blockLeft) return LEFT;
          if (ballRight > blockLeft + block.width) return RIGHT;
        }
        if (ballTop > blockTop) return DOWN;
        if (ballTop <= blockTop) return UP;
        return UP;
      };
      return {
        ...withNewBallDirection(getNewBallNormal()),
        blockGrid: state.blockGrid,
      };
    }
  }
  return withNewBallProps({ center: newBallCenter });
};
