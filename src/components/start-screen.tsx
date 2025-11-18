import Button from "./button";

interface StartScreenProps {
  width: number;
  height: number;
  onStart: () => void;
}

export default function StartScreen({
  width,
  height,
  onStart,
}: StartScreenProps) {
  const centerX = width / 2;
  const centerY = height / 2;
  const titleSize = Math.min(width, height) * 0.1;
  const textSize = Math.min(width, height) * 0.05;

  return (
    <svg width={width} height={height} className="start-screen">
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
        className="start-title"
        fill="#ecf0f1"
      >
        BRICKS BREAKER
      </text>
      <text
        x={centerX}
        y={centerY}
        fontSize={textSize}
        textAnchor="middle"
        className="start-text"
        fill="#ecf0f1"
      >
        Use arrow keys or A/D to move the paddle
      </text>
      <text
        x={centerX}
        y={centerY + height * 0.05}
        fontSize={textSize}
        textAnchor="middle"
        className="start-text"
        fill="#ecf0f1"
      >
        Press SPACE to pause
      </text>
      <Button
        screenWidth={width}
        screenHeight={height}
        text="Start Game"
        onClick={onStart}
        fill="#3498db"
        className="start-button"
      />
    </svg>
  );
}
