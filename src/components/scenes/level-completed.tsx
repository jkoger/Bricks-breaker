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
  return (
    <div className="level-completed-screen" style={{ width, height }}>
      <div className="level-completed-screen-overlay"></div>
      <div className="level-completed-screen-content">
        <h1 className="level-completed-title">LEVEL {level} COMPLETED!</h1>
        <p className="level-completed-text">
          Great job! Ready for the next challenge?
        </p>
        <button className="continue-button" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}
