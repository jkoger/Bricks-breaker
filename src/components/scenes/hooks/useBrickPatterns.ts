import { useEffect, useRef } from "react";

export function useBrickPatterns(
  brickImages: ImageBitmap[],
  canvasContext: CanvasRenderingContext2D | null,
): React.RefObject<CanvasPattern[] | null> {
  const patternsRef = useRef<CanvasPattern[] | null>(null);

  useEffect(() => {
    if (patternsRef.current && canvasContext === null) {
      patternsRef.current = null;
      return;
    }
    if (
      brickImages.length > 0 &&
      canvasContext !== null &&
      patternsRef.current === null
    ) {
      try {
        const patterns: CanvasPattern[] = [];

        for (const image of brickImages) {
          const pattern = canvasContext.createPattern(image, "repeat");
          if (pattern === null) {
            console.warn("Failed to create pattern for brick image");

            continue;
          }
          patterns.push(pattern);
        }

        if (patterns.length > 0) {
          patternsRef.current = patterns;
        }
      } catch (error) {
        console.error("Error creating brick patterns:", error);
        patternsRef.current = null;
      }
    }
  }, [brickImages, canvasContext]);

  return patternsRef;
}
