import { useEffect, useState } from "react";
import Button from "./button";
import buttonImage from "../../assets/images/button.webp";

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
      <h1 className="overlay-title">LEVEL {level} COMPLETED!</h1>
      <p className="overlay-text">Great job! Ready for the next challenge?</p>
      <Button onClick={onContinue}>CONTINUE</Button>
    </div>
  );
}
