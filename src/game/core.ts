import Vector from "./vector";
import { flatten, getRandomFrom } from "../utils";
import type { Level } from "./levels";

const PADDLE_AREA = 1 / 3;
const BLOCK_HEIGHT = 1 / 3;
const PADDLE_HEIGHT = BLOCK_HEIGHT;
const BALL_RADIUS = 1 / 5;

const LEFT = new Vector(-1, 0);
const RIGHT = new Vector(1, 0);
const UP = new Vector(0, -1);

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

export const getGameStateFromLevel = (level: Level): GameState => {
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
    lives: level.lives,
    speed: level.speed,
  };
};
