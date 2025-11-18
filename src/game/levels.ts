import { getRange } from "../utils";

export const BLOCK_MAX_DENSITY = 3;

const getRandomBlock = (): number =>
  Math.floor(Math.random() * BLOCK_MAX_DENSITY);

const getBlocks = (rows: number, columns: number): number[][] =>
  getRange(rows).map(() => getRange(columns).map(getRandomBlock));

export interface Level {
  lives: number;
  paddleWidth: number;
  speed: number;
  blocks: number[][];
}

export const LEVELS: Level[] = [
  {
    lives: 5,
    paddleWidth: 3.5,
    speed: 1,
    blocks: getBlocks(3, 6),
  },
  {
    lives: 4,
    paddleWidth: 3,
    speed: 1.4,
    blocks: getBlocks(4, 7),
  },
  {
    lives: 3,
    paddleWidth: 2.5,
    speed: 1.8,
    blocks: getBlocks(5, 8),
  },
  {
    lives: 3,
    paddleWidth: 2,
    speed: 2.2,
    blocks: getBlocks(6, 9),
  },
];
