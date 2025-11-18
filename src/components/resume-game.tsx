import Button from "./button";

interface ResumeGameProps {
  width: number;
  height: number;
  onContinue: () => void;
  onStartNew: () => void;
}

export default function ResumeGame({
  width,
  height,
  onContinue,
  onStartNew,
}: ResumeGameProps) {
  const centerX = width / 2;
  const centerY = height / 2;
  const titleSize = Math.min(width, height) * 0.1;
  const textSize = Math.min(width, height) * 0.05;
  const buttonWidth = width * 0.3;
  const buttonHeight = height * 0.1;
  const buttonSpacing = height * 0.05;
  const continueButtonX = centerX - buttonWidth / 2;
  const continueButtonY = centerY + height * 0.1;
  const startNewButtonX = centerX - buttonWidth / 2;
  const startNewButtonY = continueButtonY + buttonHeight + buttonSpacing;
  const fontSize = textSize * 1.2;

  return (
    <svg width={width} height={height} className="resume-game-screen">
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
        className="resume-game-title"
        fill="#ecf0f1"
      >
        UNFINISHED GAME
      </text>
      <text
        x={centerX}
        y={centerY}
        fontSize={textSize}
        textAnchor="middle"
        className="resume-game-text"
        fill="#ecf0f1"
      >
        You have unfinished game. Would you like to continue?
      </text>
      <Button
        screenWidth={width}
        screenHeight={height}
        text="Continue"
        onClick={onContinue}
        fill="#27ae60"
        className="continue-button"
        x={continueButtonX}
        y={continueButtonY}
        width={buttonWidth}
        height={buttonHeight}
        fontSize={fontSize}
      />
      <text
        x={centerX}
        y={startNewButtonY - buttonSpacing / 2}
        fontSize={textSize}
        textAnchor="middle"
        className="resume-game-text"
        fill="#ecf0f1"
      >
        Or start a new game?
      </text>
      <Button
        screenWidth={width}
        screenHeight={height}
        text="Start new game"
        onClick={onStartNew}
        fill="#3498db"
        className="start-button"
        x={startNewButtonX}
        y={startNewButtonY}
        width={buttonWidth}
        height={buttonHeight}
        fontSize={fontSize}
      />
    </svg>
  );
}
