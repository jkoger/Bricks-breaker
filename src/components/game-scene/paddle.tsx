import paddleImage from "../../assets/images/paddle.png";

interface PaddleProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function Paddle({ x, y, width, height }: PaddleProps) {
  const cornerRadius = height * 0.5;

  return (
    <>
      <rect
        className="paddle"
        x={x}
        y={y}
        width={width}
        height={height}
        rx={cornerRadius}
        ry={cornerRadius}
      />
      <image
        href={paddleImage}
        x={x}
        y={y}
        width={width}
        height={height}
        preserveAspectRatio="none"
      />
    </>
  );
}
