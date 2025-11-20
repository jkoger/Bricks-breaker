interface GameWonProps {
  width: number;
  height: number;
  onNewGame: () => void;
}

export default function GameWon({ width, height, onNewGame }: GameWonProps) {
  return (
    <div className="game-won-screen" style={{ width, height }}>
      <div className="game-won-screen-overlay"></div>
      <div className="game-won-screen-content">
        <h1 className="game-won-title">CONGRATULATIONS!</h1>
        <p className="game-won-text">You completed all levels! Amazing work!</p>
        <button className="play-again-button" onClick={onNewGame}>
          Play again
        </button>
      </div>
    </div>
  );
}
