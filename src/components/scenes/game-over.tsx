import { useEffect, useState } from "react";
import Button from "./button";
import buttonImage from "../../assets/images/button.png";

interface GameOverProps {
  width: number;
  height: number;
  onRestart: () => void;
}

export default function GameOver({ width, height, onRestart }: GameOverProps) {
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
      <h1 className="overlay-title">GAME OVER</h1>
      <p className="overlay-text">You ran out of lives. Try again?</p>
      <Button onClick={onRestart}>START AGAIN</Button>
    </div>
  );
}
