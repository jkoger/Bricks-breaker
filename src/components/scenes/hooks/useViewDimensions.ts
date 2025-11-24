import { useMemo } from "react";
import type { GameState } from "../../../game/core";

interface ViewDimensions {
  width: number;
  height: number;
}

export function useViewDimensions(
  game: GameState,
  projectDistance: (distance: number) => number,
): ViewDimensions {
  return useMemo(
    () => ({
      width: projectDistance(game.size.width),
      height: projectDistance(game.size.height),
    }),
    [game.size.width, game.size.height, projectDistance],
  );
}
