import type { GameState, Movement } from "./core";
import { getGameStateFromLevel, getNewGameState } from "./core";
import { LEVELS } from "./levels";
import type { GameSnapshot } from "./storage";
import { extractGameSnapshot, restoreGameStateFromSnapshot } from "./storage";

export class GameEngine {
  private state: GameState;

  constructor(state: GameState) {
    this.state = state;
  }

  getState(): GameState {
    return this.state;
  }

  step(delta: number, movement: Movement | undefined): GameState {
    this.state = getNewGameState(this.state, movement, delta);
    return this.state;
  }

  reset(level: number, lives: number, seed?: number): GameState {
    const levelData = LEVELS[level];
    if (!levelData) {
      throw new Error(`Invalid level: ${level}`);
    }
    this.state = getGameStateFromLevel(levelData, lives, seed);
    return this.state;
  }

  resetToLevel(level: number): GameState {
    const currentLives = this.state.lives;
    const currentSeed = this.state.seed;
    return this.reset(level, currentLives, currentSeed);
  }

  continueToNextLevel(): GameState {
    const currentLevel = this.getCurrentLevel();
    const nextLevel =
      currentLevel < LEVELS.length - 1 ? currentLevel + 1 : currentLevel;
    const currentLives = this.state.lives;
    const currentSeed = this.state.seed;
    return this.reset(nextLevel, currentLives, currentSeed);
  }

  getCurrentLevel(): number {
    for (let i = 0; i < LEVELS.length; i++) {
      const levelData = LEVELS[i];
      if (this.state.size.width === levelData.blocks[0].length) {
        return i;
      }
    }
    return 0;
  }

  isGameOver(): boolean {
    return this.state.lives < 1;
  }

  isLevelCompleted(): boolean {
    return this.state.blockGrid.getActiveCount() < 1;
  }

  isGameWon(): boolean {
    const currentLevel = this.getCurrentLevel();
    return this.isLevelCompleted() && currentLevel === LEVELS.length - 1;
  }
  serialize(): GameSnapshot {
    const level = this.getCurrentLevel();
    return extractGameSnapshot(level, this.state);
  }

  static fromSnapshot(snapshot: GameSnapshot): GameEngine {
    const { game } = restoreGameStateFromSnapshot(snapshot);
    return new GameEngine(game);
  }
}
