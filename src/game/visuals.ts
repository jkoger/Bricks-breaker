import { getRange } from "../utils";
import { BLOCK_MAX_DENSITY } from "./levels";

export const heartPath = new Path2D(
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
);

export const blockColors = getRange(BLOCK_MAX_DENSITY).map(
  (i) => `rgba(231, 76, 60, ${1 / (BLOCK_MAX_DENSITY - i)})`,
);

export const BLOCK_STROKE_COLOR = "#693612";
export const BLOCK_STROKE_WIDTH = 2.5;

// Glow and stroke colors
export const ORANGE_GLOW = "rgba(255, 180, 100, 0.4)";
export const ORANGE_GLOW_SOFT = "rgba(255, 180, 100, 0.3)";
export const ORANGE_GLOW_STRONG = "rgba(255, 140, 0, 0.4)";
export const BROWN_STROKE = "rgba(139, 69, 19, 0.6)";
export const BROWN_OUTLINE = "rgba(139, 69, 19, 0.3)";
