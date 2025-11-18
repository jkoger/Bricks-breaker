import Button from "./button";

interface GameOverProps {
  width: number;
  height: number;
  onRestart: () => void;
}

export default function GameOver({ width, height, onRestart }: GameOverProps) {
  const centerX = width / 2;
  const centerY = height / 2;
  const titleSize = Math.min(width, height) * 0.1;
  const textSize = Math.min(width, height) * 0.05;

  return (
    <svg width={width} height={height} className="game-over-screen">
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
        className="game-over-title"
        fill="#ecf0f1"
      >
        GAME OVER
      </text>
      <text
        x={centerX}
        y={centerY}
        fontSize={textSize}
        textAnchor="middle"
        className="game-over-text"
        fill="#ecf0f1"
      >
        You ran out of lives. Try again?
      </text>
      <Button
        screenWidth={width}
        screenHeight={height}
        text="Start again"
        onClick={onRestart}
        fill="#e74c3c"
        className="restart-button"
      />
    </svg>
  );
}
