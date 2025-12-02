import { useEffect, useState } from "react";
import Button from "./button";
import buttonImage from "../../assets/images/button.png";

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
      <h1 className="overlay-title">UNFINISHED GAME</h1>
      <p className="overlay-text">
        You have unfinished game. Would you like to continue?
      </p>
      <Button onClick={onContinue}>CONTINUE</Button>
      <p className="overlay-text">Or start a new game?</p>
      <Button onClick={onStartNew}>START GAME</Button>
    </div>
  );
}
