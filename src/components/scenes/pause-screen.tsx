import Button from "./button";

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
      <p className="overlay-text">Press SPACE to resume</p>
      <Button onClick={onResume}>RESUME</Button>
    </div>
  );
}
