import { useEffect, useState } from "react";
import Button from "./button";
import buttonImage from "../../assets/images/button.png";

interface GameWonProps {
  width: number;
  height: number;
  onNewGame: () => void;
}

export default function GameWon({ width, height, onNewGame }: GameWonProps) {
  const [buttonLoaded, setButtonLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setButtonLoaded(true);
    img.onerror = () => setButtonLoaded(true);
    img.src = buttonImage;
  }, []);

  if (!buttonLoaded) {
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
      />
    );
  }

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
