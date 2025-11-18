interface PaddleProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function Paddle({ x, y, width, height }: PaddleProps) {
  return <rect className="paddle" x={x} y={y} width={width} height={height} />;
}
