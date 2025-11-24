import { useMemo } from "react";
import Vector from "../../../game/vector";

interface ContainerSize {
  width: number;
  height: number;
}

interface GameSize {
  width: number;
  height: number;
}

export interface Projectors {
  projectDistance: (distance: number) => number;
  projectVector: (vector: Vector) => Vector;
}

export function useProjectors(
  containerSize: ContainerSize,
  gameSize: GameSize,
): Projectors {
  return useMemo(() => {
    const widthRatio = containerSize.width / gameSize.width;
    const heightRatio = containerSize.height / gameSize.height;
    const unitOnScreen = Math.min(widthRatio, heightRatio);

    return {
      projectDistance: (distance: number) => distance * unitOnScreen,
      projectVector: (vector: Vector) => vector.scaleBy(unitOnScreen),
    };
  }, [
    containerSize.width,
    containerSize.height,
    gameSize.width,
    gameSize.height,
  ]);
}
