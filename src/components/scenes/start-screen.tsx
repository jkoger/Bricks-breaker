import logoImage from "../../assets/images/logo.png";
import Button from "./button";

interface StartScreenProps {
  width: number;
  height: number;
  onStart: () => void;
}

export default function StartScreen({
  width,
  height,
  onStart,
}: StartScreenProps) {
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
      <img src={logoImage} alt="Bricks Breaker" className="logo" />
      <p className="overlay-text">Use ← → or A D to move the paddle</p>
      <p className="overlay-text">Press SPACE to pause</p>
      <Button onClick={onStart}>START GAME</Button>
    </div>
  );
}
