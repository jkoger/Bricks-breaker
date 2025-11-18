interface BallProps {
  x: number;
  y: number;
  radius: number;
}

export default function Ball({ x, y, radius }: BallProps) {
  return <circle className="ball" cx={x} cy={y} r={radius} />;
}
