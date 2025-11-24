import { LEVELS } from "../../../game/levels";
import {
  MOVEMENT,
  MOVEMENT_KEYS,
  getGameStateFromLevel,
  type GameState,
  type Movement,
} from "../../../game/core";
import { GameEngine } from "../../../game/engine";
import {
  getStoredLevel,
  hasActiveGame,
  saveLevelProgress,
  saveGameState,
  loadLevelProgress,
  loadGameState,
  setLevel,
  setGameActive,
  clearGameState,
} from "../../../game/storage";

export interface CoreSceneState {
  started: boolean;
  levelCompleted: boolean;
  gameOver: boolean;
  gameWon: boolean;
  showResume: boolean;
  isPaused: boolean;
  level: number;
  movement: Movement | undefined;
}

export function isGameActive(state: CoreSceneState): boolean {
  return (
    state.started && !state.levelCompleted && !state.gameOver && !state.gameWon
  );
}

export function updateState(
  state: CoreSceneState,
  updates: Partial<CoreSceneState>,
): CoreSceneState {
  return { ...state, ...updates };
}

export function saveLevelProgressForState(
  level: number,
  game: GameState,
): void {
  saveLevelProgress(level, game.lives, game.seed);
}

export function handleNewGameStart(level: number, game: GameState): void {
  setLevel(level);
  setGameActive(true);
  saveLevelProgressForState(level, game);
}

export function hasStateTransition(
  current: boolean,
  previous: boolean,
): boolean {
  return current && !previous;
}

export function persist(
  state: CoreSceneState,
  engine: GameEngine,
  previousState?: CoreSceneState,
): void {
  if (!previousState) return;

  const game = engine.getState();

  if (
    hasStateTransition(state.gameOver, previousState.gameOver) ||
    hasStateTransition(state.gameWon, previousState.gameWon)
  ) {
    clearGameState();
    return;
  }
  if (hasStateTransition(state.levelCompleted, previousState.levelCompleted)) {
    saveLevelProgressForState(state.level, game);
    return;
  }

  if (
    state.started &&
    state.level === 0 &&
    (!previousState.started || previousState.gameOver || previousState.gameWon)
  ) {
    handleNewGameStart(0, game);
    return;
  }

  if (
    state.started &&
    state.level !== previousState.level &&
    previousState.started
  ) {
    setLevel(state.level);
    saveLevelProgressForState(state.level, game);
    return;
  }

  if (hasStateTransition(state.started, previousState.started)) {
    setGameActive(true);
  } else if (hasStateTransition(!state.started, !previousState.started)) {
    setGameActive(false);
  }

  if (
    hasStateTransition(state.isPaused, previousState.isPaused) &&
    state.started
  ) {
    const snapshot = engine.serialize();
    saveGameState(snapshot);
  }
}

export interface InitialData {
  state: CoreSceneState;
  game: GameState;
}

export function loadGameStateOrCreate(showResume: boolean): {
  level: number;
  game: GameState;
} {
  if (!showResume) {
    const level = getStoredLevel();
    return { level, game: getGameStateFromLevel(LEVELS[level], 5) };
  }

  const restored = loadGameState();
  if (restored) {
    return { level: restored.level, game: restored.game };
  }

  const progress = loadLevelProgress();
  if (progress) {
    const { level: savedLevel, lives, seed } = progress;
    if (savedLevel >= 0 && savedLevel < LEVELS.length) {
      return {
        level: savedLevel,
        game: getGameStateFromLevel(LEVELS[savedLevel], lives, seed),
      };
    }
  }

  const level = getStoredLevel();
  return { level, game: getGameStateFromLevel(LEVELS[level], 5) };
}

export function createInitialSceneState(
  showResume: boolean,
  level: number,
): CoreSceneState {
  return {
    started: false,
    levelCompleted: false,
    gameOver: false,
    gameWon: false,
    showResume,
    isPaused: false,
    level,
    movement: undefined,
  };
}

export function getInitialData(_containerSize: {
  width: number;
  height: number;
}): InitialData {
  const showResume = hasActiveGame();
  const { level, game } = loadGameStateOrCreate(showResume);

  return {
    state: createInitialSceneState(showResume, level),
    game,
  };
}

export function getMovementFromKeyCode(keyCode: number): Movement | null {
  if (MOVEMENT_KEYS.LEFT.includes(keyCode as 65 | 37)) {
    return MOVEMENT.LEFT;
  }
  if (MOVEMENT_KEYS.RIGHT.includes(keyCode as 68 | 39)) {
    return MOVEMENT.RIGHT;
  }
  return null;
}

export function restoreEngineFromStorage(): {
  level: number;
  game: GameState;
} | null {
  const restored = loadGameState();
  if (restored) {
    return { level: restored.level, game: restored.game };
  }

  const progress = loadLevelProgress();
  if (progress) {
    const { level: savedLevel, lives, seed } = progress;
    if (savedLevel >= 0 && savedLevel < LEVELS.length) {
      const game = getGameStateFromLevel(LEVELS[savedLevel], lives, seed);
      return { level: savedLevel, game };
    }
  }

  return null;
}

export function getPauseToggleState(
  state: CoreSceneState,
  restoredData: { level: number; game: GameState } | null,
): Partial<CoreSceneState> {
  if (state.isPaused) {
    if (restoredData) {
      return {
        movement: undefined,
        isPaused: false,
        level: restoredData.level,
      };
    }
    return {
      movement: undefined,
      isPaused: false,
    };
  }
  return {
    movement: undefined,
    isPaused: true,
  };
}

export function resetGameToLevel(
  engine: GameEngine,
  level: number,
  lives: number = 5,
): void {
  engine.reset(level, lives);
}

export function processGameTick(
  engine: GameEngine,
  state: CoreSceneState,
  delta: number,
): Partial<CoreSceneState> | null {
  engine.step(delta, state.movement);

  if (engine.isGameOver()) {
    return { gameOver: true };
  }

  if (engine.isLevelCompleted()) {
    if (engine.isGameWon()) {
      return { gameWon: true };
    }
    return { levelCompleted: true };
  }

  return null;
}

export function getSafeDelta(payload: unknown): number {
  if (typeof payload === "number" && !Number.isNaN(payload)) {
    return payload;
  }
  return 1000 / 60;
}

export function canProcessGameTick(state: CoreSceneState): boolean {
  return state.started && !state.isPaused && isGameActive(state);
}
