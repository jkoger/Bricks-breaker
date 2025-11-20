import { useEffect, useRef, useState } from "react";
import { getRange } from "../../utils.ts";
import { BLOCK_MAX_DENSITY } from "../../game/levels.ts";
import brickImage from "../../assets/images/brick.png";
import brick1Image from "../../assets/images/brick1.png";

const colors = getRange(BLOCK_MAX_DENSITY).map(
  (i) => `rgba(255, 140, 0, ${(1 / (BLOCK_MAX_DENSITY - i)) * 0.5})`,
);

const brickImages = [brickImage, brick1Image];

interface BlockProps {
  x: number;
  y: number;
  width: number;
  height: number;
  density: number;
}

export default function Block({ x, y, width, height, density }: BlockProps) {
  const [isHit, setIsHit] = useState(false);
  const prevDensityRef = useRef(density);

  useEffect(() => {
    if (prevDensityRef.current > density) {
      setIsHit(true);
      const timer = setTimeout(() => setIsHit(false), 100);
      return () => clearTimeout(timer);
    }
    prevDensityRef.current = density;
  }, [density]);

  const cornerRadius = Math.min(width, height) * 0.15;

  const clipId = `block-clip-${Math.round(x)}-${Math.round(y)}-${Math.round(width)}-${Math.round(height)}`;

  const selectedBrickImage =
    brickImages[Math.floor((x + y) * 1000) % brickImages.length];

  const highlightHeight = height * 0.2;

  const currentColor = isHit
    ? `rgba(255, 200, 100, ${(1 / (BLOCK_MAX_DENSITY - density)) * 0.7})`
    : colors[density];

  return (
    <>
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={cornerRadius}
            ry={cornerRadius}
          />
        </clipPath>
        <linearGradient
          id={`highlight-${clipId}`}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.3)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
        </linearGradient>
        <linearGradient
          id={`dark-gradient-${clipId}`}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop offset="0%" stopColor="rgba(0, 0, 0, 0.1)" />
          <stop offset="100%" stopColor="rgba(0, 0, 0, 0.05)" />
        </linearGradient>
      </defs>
      <image
        href={selectedBrickImage}
        x={x}
        y={y}
        width={width}
        height={height}
        preserveAspectRatio="none"
        clipPath={`url(#${clipId})`}
      />
      <rect
        className="block"
        fill={currentColor}
        x={x}
        y={y}
        width={width}
        height={height}
        rx={cornerRadius}
        ry={cornerRadius}
        style={{ transition: "fill 0.05s ease-out" }}
      />
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={cornerRadius}
        ry={cornerRadius}
        fill={`url(#dark-gradient-${clipId})`}
        clipPath={`url(#${clipId})`}
      />
      <rect
        x={x}
        y={y}
        width={width}
        height={highlightHeight}
        rx={cornerRadius}
        ry={cornerRadius}
        fill={`url(#highlight-${clipId})`}
        clipPath={`url(#${clipId})`}
      />
    </>
  );
}
