interface ButtonProps {
  screenWidth: number;
  screenHeight: number;
  text: string;
  onClick: () => void;
  fill: string;
  className: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fontSize?: number;
}

export default function Button({
  screenWidth,
  screenHeight,
  text,
  onClick,
  fill,
  className,
  x,
  y,
  width,
  height,
  fontSize,
}: ButtonProps) {
  const centerX = screenWidth / 2;
  const centerY = screenHeight / 2;
  const textSize = Math.min(screenWidth, screenHeight) * 0.05;
  const buttonWidth = width ?? screenWidth * 0.3;
  const buttonHeight = height ?? screenHeight * 0.1;
  const buttonX = x ?? centerX - buttonWidth / 2;
  const buttonY = y ?? centerY + screenHeight * 0.15;
  const buttonFontSize = fontSize ?? textSize * 1.2;
  const textCenterX = buttonX + buttonWidth / 2;
  const textCenterY = buttonY + buttonHeight / 2;

  return (
    <g className={className} onClick={onClick} style={{ cursor: "pointer" }}>
      <rect
        x={buttonX}
        y={buttonY}
        width={buttonWidth}
        height={buttonHeight}
        fill={fill}
        rx={buttonHeight * 0.2}
      />
      <text
        x={textCenterX}
        y={textCenterY}
        fontSize={buttonFontSize}
        textAnchor="middle"
        fill="#ecf0f1"
        dominantBaseline="middle"
      >
        {text}
      </text>
    </g>
  );
}
