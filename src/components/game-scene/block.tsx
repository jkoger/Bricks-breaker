import { getRange } from "../../utils.ts";
import { BLOCK_MAX_DENSITY } from "../../game/levels.ts";

const colors = getRange(BLOCK_MAX_DENSITY).map(
  (i) => `rgba(231, 76, 60, ${1 / (BLOCK_MAX_DENSITY - i)})`,
);

interface BlockProps {
  x: number;
  y: number;
  width: number;
  height: number;
  density: number;
}

export default function Block({ x, y, width, height, density }: BlockProps) {
  return (
    <rect
      className="block"
      fill={colors[density]}
      x={x}
      y={y}
      width={width}
      height={height}
    />
  );
}
