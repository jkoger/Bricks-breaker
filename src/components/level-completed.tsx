import Button from "./button";

interface LevelCompletedProps {
  width: number;
  height: number;
  level: number;
  onContinue: () => void;
}

export default function LevelCompleted({
  width,
  height,
  level,
  onContinue,
}: LevelCompletedProps) {
  const centerX = width / 2;
  const centerY = height / 2;
  const titleSize = Math.min(width, height) * 0.1;
  const textSize = Math.min(width, height) * 0.05;

  return (
    <svg width={width} height={height} className="level-completed-screen">
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
        className="level-completed-title"
        fill="#ecf0f1"
      >
        LEVEL {level} COMPLETED!
      </text>
      <text
        x={centerX}
        y={centerY}
        fontSize={textSize}
        textAnchor="middle"
        className="level-completed-text"
        fill="#ecf0f1"
      >
        Great job! Ready for the next challenge?
      </text>
      <Button
        screenWidth={width}
        screenHeight={height}
        text="Continue"
        onClick={onContinue}
        fill="#27ae60"
        className="continue-button"
      />
    </svg>
  );
}
