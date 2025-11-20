import logoImage from "../../assets/images/logo.png";

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
    <div className="start-screen" style={{ width, height }}>
      <div className="start-screen-overlay"></div>
      <div className="start-screen-content">
        <img src={logoImage} alt="Bricks Breaker" className="start-logo" />
        <p className="start-text">Use arrow keys or A/D to move the paddle</p>
        <p className="start-text">Press SPACE to pause</p>
        <button className="start-button" onClick={onStart}>
          Start Game
        </button>
      </div>
    </div>
  );
}
