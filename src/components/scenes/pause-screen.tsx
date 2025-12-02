import { useEffect, useState } from "react";
import Button from "./button";
import buttonImage from "../../assets/images/button.png";

interface PauseScreenProps {
  width: number;
  height: number;
  onResume: () => void;
}

export default function PauseScreen({
  width,
  height,
  onResume,
}: PauseScreenProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [buttonLoaded, setButtonLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setButtonLoaded(true);
    img.onerror = () => setButtonLoaded(true);
    img.src = buttonImage;
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        ) || window.innerWidth < 768,
      );
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!buttonLoaded) {
    return (
      <div
        className="overlay-screen pause-overlay"
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
      className="overlay-screen pause-overlay"
      style={
        {
          width,
          height,
          "--container-width": `${width}px`,
        } as React.CSSProperties
      }
    >
      <h1 className="overlay-title">PAUSED</h1>
      <p className="overlay-text">
        {isMobile
          ? "Tap RESUME or double tap the screen to resume"
          : "Press SPACE to resume"}
      </p>
      <Button onClick={onResume}>RESUME</Button>
    </div>
  );
}
