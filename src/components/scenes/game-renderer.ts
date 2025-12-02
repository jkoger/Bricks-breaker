import type { GameState } from "../../game/core";
import Vector from "../../game/vector";
import {
  heartPath,
  BLOCK_STROKE_COLOR,
  BLOCK_STROKE_WIDTH,
  ORANGE_GLOW,
  ORANGE_GLOW_SOFT,
  ORANGE_GLOW_STRONG,
  BROWN_STROKE,
  BROWN_OUTLINE,
} from "../../game/visuals";
import { BLOCK_MAX_DENSITY } from "../../game/levels";

interface RenderContext {
  ctx: CanvasRenderingContext2D;
  game: GameState;
  level: number;
  unit: number;
  viewWidth: number;
  viewHeight: number;
  projectDistance: (distance: number) => number;
  projectVector: (vector: Vector) => Vector;
  images: {
    paddle: ImageBitmap | null;
    ball: ImageBitmap | null;
    bricks: ImageBitmap[];
  };
  brickPatterns: CanvasPattern[] | null;
}

function setupSmoothRendering(ctx: CanvasRenderingContext2D) {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
}

function setShadow(
  ctx: CanvasRenderingContext2D,
  color: string,
  blur: number,
  offsetX = 0,
  offsetY = 0,
) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = offsetX;
  ctx.shadowOffsetY = offsetY;
}

function clearShadow(ctx: CanvasRenderingContext2D) {
  setShadow(ctx, "transparent", 0);
}

function withSave(ctx: CanvasRenderingContext2D, draw: () => void) {
  ctx.save();
  draw();
  ctx.restore();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawLives(
  ctx: CanvasRenderingContext2D,
  game: GameState,
  unit: number,
) {
  const baseSize = 24;
  const scale = unit / baseSize;
  const heartSize = baseSize * scale;

  for (let i = 0; i < game.lives; i += 1) {
    const x = unit + (unit + unit / 2) * i;
    const y = unit;

    withSave(ctx, () => {
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      const heartGradient = ctx.createLinearGradient(0, 0, 0, baseSize);
      heartGradient.addColorStop(0, "rgba(255, 100, 100, 1)");
      heartGradient.addColorStop(0.5, "rgba(231, 76, 60, 1)");
      heartGradient.addColorStop(1, "rgba(192, 57, 43, 1)");

      setShadow(ctx, ORANGE_GLOW_STRONG, Math.max(4, heartSize * 0.8));
      ctx.fillStyle = heartGradient;
      ctx.fill(heartPath);

      clearShadow(ctx);
      ctx.strokeStyle = BROWN_STROKE;
      ctx.lineWidth = 1.5;
      ctx.stroke(heartPath);

      withSave(ctx, () => {
        ctx.globalCompositeOperation = "overlay";

        const topHighlight = ctx.createLinearGradient(0, 0, 0, 10);
        topHighlight.addColorStop(0, "rgba(255, 255, 255, 0.6)");
        topHighlight.addColorStop(0.4, "rgba(255, 220, 200, 0.4)");
        topHighlight.addColorStop(1, "rgba(255, 220, 200, 0)");
        ctx.fillStyle = topHighlight;
        ctx.fill(heartPath);

        const leftHighlight = ctx.createLinearGradient(0, 0, 6, 0);
        leftHighlight.addColorStop(0, "rgba(255, 220, 200, 0.3)");
        leftHighlight.addColorStop(1, "rgba(255, 220, 200, 0)");
        ctx.fillStyle = leftHighlight;
        ctx.fill(heartPath);
      });
    });
  }
}

function drawLevelText(
  ctx: CanvasRenderingContext2D,
  level: number,
  unit: number,
  viewWidth: number,
) {
  const levelFontSize = unit * 1.2;
  const levelText = `LEVEL: ${level + 1}`;
  const levelX = viewWidth - unit;
  const levelY = unit * 2;

  withSave(ctx, () => {
    ctx.font = `bold ${levelFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#e2ae6a";
    setShadow(
      ctx,
      "rgba(0, 0, 0, 0.55)",
      levelFontSize * 0.2,
      0,
      levelFontSize * 0.08,
    );
    ctx.strokeStyle = BROWN_OUTLINE;
    ctx.lineWidth = 0.5;
    ctx.strokeText(levelText, levelX, levelY);
    ctx.fillText(levelText, levelX, levelY);
    clearShadow(ctx);

    withSave(ctx, () => {
      const highlightGradient = ctx.createLinearGradient(
        levelX,
        levelY - levelFontSize * 0.5,
        levelX,
        levelY,
      );
      highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.2)");
      highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.globalCompositeOperation = "overlay";
      ctx.fillStyle = highlightGradient;
      ctx.fillText(levelText, levelX, levelY);
    });
  });
}

function drawBlocks(
  ctx: CanvasRenderingContext2D,
  game: GameState,
  projectVector: (vector: Vector) => Vector,
  projectDistance: (distance: number) => number,
  brickImages: ImageBitmap[],
  brickPatterns: CanvasPattern[] | null,
) {
  const hasTextures = brickImages.length > 0;
  const tintBase = BLOCK_MAX_DENSITY - 1;

  withSave(ctx, () => {
    ctx.lineWidth = BLOCK_STROKE_WIDTH;
    ctx.strokeStyle = BLOCK_STROKE_COLOR;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    game.blockGrid.forEachActiveBlock((block) => {
      const { x, y } = projectVector(block.position);
      const width = projectDistance(block.width);
      const height = projectDistance(block.height);
      const halfStroke = ctx.lineWidth / 2;

      const innerX = x + halfStroke;
      const innerY = y + halfStroke;
      const innerWidth = width - ctx.lineWidth;
      const innerHeight = height - ctx.lineWidth;
      const cornerRadius = Math.min(innerWidth * 0.08, innerHeight * 0.08, 3);

      const drawBlockShape = () =>
        drawRoundedRect(
          ctx,
          innerX,
          innerY,
          innerWidth,
          innerHeight,
          cornerRadius,
        );

      withSave(ctx, () => {
        setShadow(
          ctx,
          "rgba(0, 0, 0, 0.3)",
          Math.max(2, width * 0.05),
          Math.max(1, width * 0.02),
          Math.max(1, height * 0.02),
        );

        if (hasTextures && block.textureIndex !== undefined) {
          const pattern =
            brickPatterns?.[block.textureIndex % brickPatterns.length] || null;
          if (pattern) {
            ctx.fillStyle = pattern;
            drawBlockShape();
            ctx.fill();
          }
        }

        const tintIntensity = block.density / tintBase;
        const tintAlpha = Math.min(1, tintIntensity * 0.5);

        if (tintAlpha > 0) {
          ctx.globalCompositeOperation = "multiply";
          ctx.fillStyle = `rgba(255, 140, 0, ${tintAlpha})`;
          drawBlockShape();
          ctx.fill();
          ctx.globalCompositeOperation = "source-over";
        }

        if (block.hitAt) {
          const timeSinceHit = Date.now() - block.hitAt;
          if (timeSinceHit < 100) {
            const flashAlpha = (1 - timeSinceHit / 100) * 0.6;
            ctx.globalCompositeOperation = "screen";
            ctx.fillStyle = `rgba(255, 200, 100, ${flashAlpha})`;
            drawBlockShape();
            ctx.fill();
            ctx.globalCompositeOperation = "source-over";
          }
        }
      });

      withSave(ctx, () => {
        drawBlockShape();
        ctx.clip();
        ctx.globalCompositeOperation = "overlay";

        const highlightHeight = innerHeight * 0.3;
        const topGradient = ctx.createLinearGradient(
          innerX,
          innerY,
          innerX,
          innerY + highlightHeight,
        );
        topGradient.addColorStop(0, "rgba(255, 255, 255, 0.7)");
        topGradient.addColorStop(0.4, "rgba(255, 255, 255, 0.35)");
        topGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = topGradient;
        ctx.fillRect(innerX, innerY, innerWidth, highlightHeight);

        const highlightWidth = innerWidth * 0.2;
        const leftGradient = ctx.createLinearGradient(
          innerX,
          innerY,
          innerX + highlightWidth,
          innerY,
        );
        leftGradient.addColorStop(0, "rgba(255, 255, 255, 0.15)");
        leftGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = leftGradient;
        ctx.fillRect(innerX, innerY, highlightWidth, innerHeight);

        ctx.globalCompositeOperation = "source-over";
      });

      withSave(ctx, () => {
        ctx.strokeStyle = "rgba(182, 89, 23, 0.5)";
        ctx.lineWidth = BLOCK_STROKE_WIDTH;
        drawBlockShape();
        ctx.stroke();

        ctx.strokeStyle = "rgba(22, 12, 5, 0.5)";
        ctx.lineWidth = BLOCK_STROKE_WIDTH * 0.4;
        const inset = BLOCK_STROKE_WIDTH * 0.8;
        drawRoundedRect(
          ctx,
          innerX + inset,
          innerY + inset,
          innerWidth - inset * 2,
          innerHeight - inset * 2,
          cornerRadius * 0.7,
        );
        ctx.stroke();
      });
    });
  });
}

function drawPaddle(
  ctx: CanvasRenderingContext2D,
  game: GameState,
  projectVector: (vector: Vector) => Vector,
  projectDistance: (distance: number) => number,
  paddleImg: ImageBitmap | null,
  unit: number,
) {
  const paddlePos = projectVector(game.paddle.position);
  const paddleWidth = projectDistance(game.paddle.width);
  const paddleHeight = projectDistance(game.paddle.height);

  withSave(ctx, () => {
    setShadow(ctx, ORANGE_GLOW, Math.max(2, unit * 0.8));

    if (paddleImg) {
      ctx.drawImage(
        paddleImg,
        paddlePos.x,
        paddlePos.y,
        paddleWidth,
        paddleHeight,
      );
    } else {
      ctx.fillStyle = "#33810f";
      ctx.fillRect(paddlePos.x, paddlePos.y, paddleWidth, paddleHeight);
    }
  });
}

function drawBall(
  ctx: CanvasRenderingContext2D,
  game: GameState,
  projectVector: (vector: Vector) => Vector,
  unit: number,
  ballImg: ImageBitmap | null,
) {
  const ballCenter = projectVector(game.ball.center);
  const diameter = unit * 2;

  withSave(ctx, () => {
    setShadow(ctx, ORANGE_GLOW_SOFT, Math.max(8, unit * 2));

    if (ballImg) {
      ctx.drawImage(
        ballImg,
        ballCenter.x - unit,
        ballCenter.y - unit,
        diameter,
        diameter,
      );
      return;
    }

    setShadow(ctx, "rgba(255, 180, 100, 0.9)", Math.max(8, unit * 2));
    ctx.fillStyle = "#11364d";
    ctx.beginPath();
    ctx.arc(ballCenter.x, ballCenter.y, unit, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function renderGameScene(context: RenderContext): void {
  const {
    ctx,
    game,
    level,
    unit,
    viewWidth,
    viewHeight,
    projectDistance,
    projectVector,
    images,
    brickPatterns,
  } = context;

  ctx.clearRect(0, 0, viewWidth, viewHeight);
  setupSmoothRendering(ctx);

  drawLives(ctx, game, unit);
  drawLevelText(ctx, level, unit, viewWidth);
  drawBlocks(
    ctx,
    game,
    projectVector,
    projectDistance,
    images.bricks,
    brickPatterns,
  );
  drawPaddle(ctx, game, projectVector, projectDistance, images.paddle, unit);
  drawBall(ctx, game, projectVector, unit, images.ball);
}
