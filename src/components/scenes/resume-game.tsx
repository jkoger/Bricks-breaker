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
  return (
    <div className="resume-game-screen" style={{ width, height }}>
      <div className="resume-game-screen-content">
        <h1 className="resume-game-title">UNFINISHED GAME</h1>
        <p className="resume-game-text">
          You have unfinished game. Would you like to continue?
        </p>
        <button className="continue-button" onClick={onContinue}>
          Continue
        </button>
        <p className="resume-game-text">Or start a new game?</p>
        <button className="start-button" onClick={onStartNew}>
          Start new game
        </button>
      </div>
    </div>
  );
}
