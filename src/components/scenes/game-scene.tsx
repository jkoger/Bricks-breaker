import { useEffect, useRef, useState } from "react";
import type { GameEngine } from "../../game/engine";
import Vector from "../../game/vector";
import { useGameImages } from "./hooks/useGameImages";
import { useBrickPatterns } from "./hooks/useBrickPatterns";
import { renderGameScene } from "./game-renderer";

interface GameSceneProps {
  engineRef: React.RefObject<GameEngine | null>;
  level: number;
  projectDistance: (distance: number) => number;
  projectVector: (vector: Vector) => Vector;
  viewWidth: number;
  viewHeight: number;
}

export default function GameScene({
  engineRef,
  level,
  projectDistance,
  projectVector,
  viewWidth,
  viewHeight,
}: GameSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const images = useGameImages();
  const [canvasContext, setCanvasContext] =
    useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (images.loadingState !== "loaded") return;

    const canvas = canvasRef.current;
    if (!canvas) {
      setCanvasContext(null);
      return;
    }

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      setCanvasContext(null);
      return;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    setCanvasContext(ctx);

    return () => {
      setCanvasContext(null);
    };
  }, [viewWidth, viewHeight, images.loadingState]);

  const brickPatternsRef = useBrickPatterns(
    images.bricks.current || [],
    canvasContext,
  );

  useEffect(() => {
    if (!canvasContext) return;
    if (images.loadingState !== "loaded") return;

    let animationFrameId: number;

    const draw = () => {
      const engine = engineRef.current;
      if (!engine) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }
      const game = engine.getState();
      const unit = projectDistance(game.ball.radius);

      renderGameScene({
        ctx: canvasContext,
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
          bricks: images.bricks.current || [],
        },
        brickPatterns: brickPatternsRef.current,
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    engineRef,
    level,
    projectDistance,
    projectVector,
    viewWidth,
    viewHeight,
    images,
    images.loadingState,
    canvasContext,
    brickPatternsRef,
  ]);

  if (images.loadingState !== "loaded") {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      width={viewWidth}
      height={viewHeight}
      className="scene"
    />
  );
}
