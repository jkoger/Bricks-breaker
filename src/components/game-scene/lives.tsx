import { getRange } from "../../utils.ts";

interface LivesProps {
  lives: number;
  unit: number;
}

export default function Lives({ lives, unit }: LivesProps) {
  const heartSize = unit;
  const spacing = unit / 2;

  return (
    <>
      {getRange(lives).map((i) => {
        const x = unit + heartSize * i + spacing * i;
        const y = unit;

        const scale = heartSize / 24;
        return (
          <g key={i} transform={`translate(${x}, ${y}) scale(${scale})`}>
            <path
              className="life"
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill="currentColor"
              stroke="none"
            />
          </g>
        );
      })}
    </>
  );
}
