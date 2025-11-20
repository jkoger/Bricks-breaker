import Button from "./button";

interface GameOverProps {
  width: number;
  height: number;
  onRestart: () => void;
}

export default function GameOver({ width, height, onRestart }: GameOverProps) {
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
      <h1 className="overlay-title">GAME OVER</h1>
      <p className="overlay-text">You ran out of lives. Try again?</p>
      <Button onClick={onRestart}>START AGAIN</Button>
    </div>
  );
}
