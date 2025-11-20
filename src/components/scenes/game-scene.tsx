import { useEffect, useRef } from "react";
import type { GameState } from "../../game/core";
import Vector from "../../game/vector";
import { useGameImages } from "./hooks/useGameImages";
import { renderGameScene } from "./game-renderer";

interface GameSceneProps {
  gameRef: React.RefObject<GameState>;
  level: number;
  projectDistance: (distance: number) => number;
  projectVector: (vector: Vector) => Vector;
  viewWidth: number;
  viewHeight: number;
}

export default function GameScene({
  gameRef,
  level,
  projectDistance,
  projectVector,
  viewWidth,
  viewHeight,
}: GameSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const images = useGameImages();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    let animationFrameId: number;

    const draw = () => {
      const game = gameRef.current;
      const unit = projectDistance(game.ball.radius);

      renderGameScene({
        ctx,
        game,
        level,
        unit,
        viewWidth,
        viewHeight,
        projectDistance,
        projectVector,
        images: {
          paddle: images.paddle.current,
          ball: images.ball.current,
          bricks: images.bricks.current,
        },
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    gameRef,
    level,
    projectDistance,
    projectVector,
    viewWidth,
    viewHeight,
    images,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={viewWidth}
      height={viewHeight}
      className="scene"
    />
  );
}
