import Button from "./button";

interface GameWonProps {
  width: number;
  height: number;
  onNewGame: () => void;
}

export default function GameWon({ width, height, onNewGame }: GameWonProps) {
  return (
    <div
      className="overlay-screen"
      style={
        {
          width,
          height,
          "--container-width": `${width}px`,
        } as React.CSSProperties
      }
    >
      <h1 className="overlay-title">CONGRATULATIONS!</h1>
      <p className="overlay-text">You completed all levels! Amazing work!</p>
      <Button onClick={onNewGame}>Play again</Button>
    </div>
  );
}
