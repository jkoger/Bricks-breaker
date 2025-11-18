import Button from "./button";

interface GameWonProps {
  width: number;
  height: number;
  onNewGame: () => void;
}

export default function GameWon({ width, height, onNewGame }: GameWonProps) {
  const centerX = width / 2;
  const centerY = height / 2;
  const titleSize = Math.min(width, height) * 0.1;
  const textSize = Math.min(width, height) * 0.05;

  return (
    <svg width={width} height={height} className="game-won-screen">
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="#2c3e50"
        opacity={0.9}
      />
      <text
        x={centerX}
        y={centerY - height * 0.15}
        fontSize={titleSize}
        textAnchor="middle"
        className="game-won-title"
        fill="#ecf0f1"
      >
        CONGRATULATIONS!
      </text>
      <text
        x={centerX}
        y={centerY}
        fontSize={textSize}
        textAnchor="middle"
        className="game-won-text"
        fill="#ecf0f1"
      >
        You completed all levels! Amazing work!
      </text>
      <Button
        screenWidth={width}
        screenHeight={height}
        text="Play again"
        onClick={onNewGame}
        fill="#27ae60"
        className="play-again-button"
      />
    </svg>
  );
}
