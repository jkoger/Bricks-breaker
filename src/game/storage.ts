import type { GameState, Block } from "./core";
import { getGameStateFromLevel } from "./core";
import Vector from "./vector";
import { LEVELS } from "./levels";

const PADDLE_AREA = 1 / 3;
const BLOCK_HEIGHT = 1 / 3;

const STORAGE_KEYS = {
  LEVEL: "level",
  GAME_ACTIVE: "gameActive",
  GAME_STATE: "gameState",
  LEVEL_PROGRESS: "levelProgress",
} as const;

export interface GameSnapshot {
  level: number;
  lives: number;
  seed: number;
  paddle: {
    position: { x: number; y: number };
  };
  ball: {
    center: { x: number; y: number };
    direction: { x: number; y: number };
  };
  blocks: Array<{
    density: number;
    position: { x: number; y: number };
    textureIndex: number;
  }>;
}

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`Failed to read from localStorage key "${key}":`, error);
    return null;
  }
}

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.error(`localStorage quota exceeded for key "${key}"`);
    } else {
      console.warn(`Failed to write to localStorage key "${key}":`, error);
    }
    return false;
  }
}

function safeRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove localStorage key "${key}":`, error);
    return false;
  }
}

export function getStoredLevel(): number {
  const stored = safeGetItem(STORAGE_KEYS.LEVEL);
  if (!stored) return 0;

  const parsed = parseInt(stored, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function setLevel(level: number): void {
  safeSetItem(STORAGE_KEYS.LEVEL, String(level));
}

export function hasActiveGame(): boolean {
  const gameActive = safeGetItem(STORAGE_KEYS.GAME_ACTIVE);
  const level = getStoredLevel();
  return gameActive === "true" && level >= 0;
}

export function setGameActive(active: boolean): void {
  safeSetItem(STORAGE_KEYS.GAME_ACTIVE, String(active));
}

export function saveLevelProgress(
  level: number,
  lives: number,
  seed: number,
): void {
  const progressData = {
    level,
    lives,
    seed,
  };

  try {
    const serialized = JSON.stringify(progressData);
    safeSetItem(STORAGE_KEYS.LEVEL_PROGRESS, serialized);
  } catch (error) {
    console.error("Failed to serialize level progress:", error);
  }
}

function serializeVector(vector: Vector | null | undefined): {
  x: number;
  y: number;
} {
  if (!vector) {
    return { x: 0, y: 0 };
  }
  return {
    x: vector.x,
    y: vector.y,
  };
}

function deserializeVector(data: { x: number; y: number }): Vector {
  return new Vector(data.x, data.y);
}

export function extractGameSnapshot(
  level: number,
  game: GameState,
): GameSnapshot {
  const blocks: Block[] = [];
  game.blockGrid.forEachActiveBlock((block) => {
    blocks.push(block);
  });

  const ballCenter = game.ball?.center;
  const ballDirection = game.ball?.direction;
  const paddlePosition = game.paddle?.position;

  const hasValidDirection = ballDirection && ballDirection.length() > 0.001;

  return {
    level,
    lives: game.lives,
    seed: game.seed,
    paddle: {
      position: serializeVector(paddlePosition),
    },
    ball: {
      center: serializeVector(ballCenter),
      direction: hasValidDirection
        ? serializeVector(ballDirection)
        : { x: 0, y: 0 },
    },
    blocks: blocks.map((block) => ({
      density: block.density,
      position: serializeVector(block.position),
      textureIndex: block.textureIndex,
    })),
  };
}

export function restoreGameStateFromSnapshot(snapshot: GameSnapshot): {
  level: number;
  game: GameState;
} {
  const levelData = LEVELS[snapshot.level];
  if (!levelData) {
    throw new Error(`Invalid level: ${snapshot.level}`);
  }

  const baseGame = getGameStateFromLevel(
    levelData,
    snapshot.lives,
    snapshot.seed,
  );

  const blockGrid = baseGame.blockGrid;

  const width = levelData.blocks[0].length;
  const height = width;
  const blocksStart =
    (height - height * PADDLE_AREA - levelData.blocks.length * BLOCK_HEIGHT) /
    2;

  const snapshotPositions = new Set<string>();
  snapshot.blocks.forEach((snapshotBlock) => {
    const col = Math.floor(snapshotBlock.position.x);
    const row = Math.floor(
      (snapshotBlock.position.y - blocksStart) / BLOCK_HEIGHT,
    );
    snapshotPositions.add(`${row},${col}`);
  });

  const baseGamePositions = new Set<string>();
  for (let i = 0; i < levelData.blocks.length; i++) {
    for (let j = 0; j < levelData.blocks[i].length; j++) {
      const block = blockGrid.getBlock(i, j);
      if (block && block.density > 0) {
        baseGamePositions.add(`${i},${j}`);
      }
    }
  }

  for (const key of baseGamePositions) {
    if (!snapshotPositions.has(key)) {
      const [row, col] = key.split(",").map(Number);
      blockGrid.setBlockDensityToZero(row, col);
    }
  }

  snapshot.blocks.forEach((snapshotBlock) => {
    const block: Block = {
      density: snapshotBlock.density,
      position: deserializeVector(snapshotBlock.position),
      width: 1,
      height: BLOCK_HEIGHT,
      textureIndex: snapshotBlock.textureIndex,
    };

    const col = Math.floor(block.position.x);
    const row = Math.floor((block.position.y - blocksStart) / BLOCK_HEIGHT);
    blockGrid.setBlock(row, col, block);
  });

  const restoredBallCenter =
    snapshot.ball?.center &&
    typeof snapshot.ball.center.x === "number" &&
    typeof snapshot.ball.center.y === "number"
      ? deserializeVector(snapshot.ball.center)
      : baseGame.ball.center;

  let restoredBallDirection = baseGame.ball.direction;
  if (
    snapshot.ball?.direction &&
    typeof snapshot.ball.direction.x === "number" &&
    typeof snapshot.ball.direction.y === "number"
  ) {
    const deserialized = deserializeVector(snapshot.ball.direction);
    if (deserialized.length() > 0.001) {
      restoredBallDirection = deserialized;
    }
  }

  return {
    level: snapshot.level,
    game: {
      ...baseGame,
      lives: snapshot.lives,
      seed: snapshot.seed,
      blockGrid,
      paddle: {
        ...baseGame.paddle,
        position: deserializeVector(snapshot.paddle.position),
      },
      ball: {
        ...baseGame.ball,
        center: restoredBallCenter,
        direction: restoredBallDirection,
      },
    },
  };
}

export function saveGameState(snapshot: GameSnapshot): void {
  try {
    const serialized = JSON.stringify(snapshot);
    safeSetItem(STORAGE_KEYS.GAME_STATE, serialized);
  } catch (error) {
    console.error("Failed to serialize game state:", error);
  }
}

export function saveGame(level: number, game: GameState): void {
  const snapshot = extractGameSnapshot(level, game);
  saveGameState(snapshot);
}

export function loadLevelProgress(): {
  level: number;
  lives: number;
  seed: number;
} | null {
  const saved = safeGetItem(STORAGE_KEYS.LEVEL_PROGRESS);
  if (!saved) return null;

  try {
    const data = JSON.parse(saved);
    return {
      level: data.level,
      lives: data.lives,
      seed: data.seed,
    };
  } catch (error) {
    console.warn("Failed to load level progress:", error);
    return null;
  }
}

export function loadGameState(): { level: number; game: GameState } | null {
  const saved = safeGetItem(STORAGE_KEYS.GAME_STATE);
  if (!saved) return null;

  try {
    const data = JSON.parse(saved);
    return restoreGameStateFromSnapshot(data as GameSnapshot);
  } catch (error) {
    console.warn("Failed to load game state:", error);
    return null;
  }
}

export function loadGame(): { level: number; game: GameState } | null {
  const gameState = loadGameState();
  if (gameState) {
    return gameState;
  }
  return null;
}

export function clearGameState(): void {
  safeRemoveItem(STORAGE_KEYS.GAME_ACTIVE);
  safeRemoveItem(STORAGE_KEYS.GAME_STATE);
  safeRemoveItem(STORAGE_KEYS.LEVEL_PROGRESS);
  safeSetItem(STORAGE_KEYS.LEVEL, "0");
}
