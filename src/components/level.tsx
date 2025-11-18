interface LevelProps {
  level: number;
  unit: number;
  containerWidth: number;
}

export default function Level({ level, unit, containerWidth }: LevelProps) {
  const text = `LEVEL: ${level}`;
  const textWidth = text.length * unit * 0.6;
  const x = containerWidth - textWidth - unit;

  return (
    <text x={x} y={unit * 2} fontSize={unit} className="level">
      LEVEL: {level}
    </text>
  );
}
