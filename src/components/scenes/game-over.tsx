interface GameOverProps {
  width: number;
  height: number;
  onRestart: () => void;
}

export default function GameOver({ width, height, onRestart }: GameOverProps) {
  return (
    <div className="game-over-screen" style={{ width, height }}>
      <div className="game-over-screen-overlay"></div>
      <div className="game-over-screen-content">
        <h1 className="game-over-title">GAME OVER</h1>
        <p className="game-over-text">You ran out of lives. Try again?</p>
        <button className="restart-button" onClick={onRestart}>
          Start again
        </button>
      </div>
    </div>
  );
}
