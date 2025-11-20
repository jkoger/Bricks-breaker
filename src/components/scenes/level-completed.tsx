import Button from "./button";

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
