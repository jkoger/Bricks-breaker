import ballImage from "../../assets/images/ball.png";

interface BallProps {
  x: number;
  y: number;
  radius: number;
}

export default function Ball({ x, y, radius }: BallProps) {
  const imageSize = radius * 2;
  const imageX = x - radius;
  const imageY = y - radius;

  return (
    <>
      <circle className="ball" cx={x} cy={y} r={radius} />
      <image
        href={ballImage}
        x={imageX}
        y={imageY}
        width={imageSize}
        height={imageSize}
        className="ball"
      />
    </>
  );
}
