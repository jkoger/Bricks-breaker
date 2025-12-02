import { useEffect, useRef, useState } from "react";
import paddleImageSrc from "../../../assets/images/paddle.webp";
import ballImageSrc from "../../../assets/images/ball.webp";
import brick1ImageSrc from "../../../assets/images/brick.webp";
import brick2ImageSrc from "../../../assets/images/brick1.webp";
import { preloadImages, preloadImage } from "../utils/preloadResources";

type LoadingState = "loading" | "loaded" | "error";

interface GameImages {
  paddle: React.RefObject<ImageBitmap | null>;
  ball: React.RefObject<ImageBitmap | null>;
  bricks: React.RefObject<ImageBitmap[]>;
  loadingState: LoadingState;
}

export function useGameImages(): GameImages {
  const paddleImageRef = useRef<ImageBitmap | null>(null);
  const ballImageRef = useRef<ImageBitmap | null>(null);
  const brickImagesRef = useRef<ImageBitmap[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");

  useEffect(() => {
    let mounted = true;

    const loadAllImages = async () => {
      try {
        setLoadingState("loading");

        const imagePromises = [
          preloadImage(paddleImageSrc),
          preloadImage(ballImageSrc),
          preloadImages([brick1ImageSrc, brick2ImageSrc]),
        ];
        const results = await Promise.allSettled(imagePromises);

        if (!mounted) return;

        if (results[0].status === "fulfilled") {
          paddleImageRef.current = results[0].value as ImageBitmap;
        }
        if (results[1].status === "fulfilled") {
          ballImageRef.current = results[1].value as ImageBitmap;
        }
        if (results[2].status === "fulfilled") {
          brickImagesRef.current = results[2].value as ImageBitmap[];
        }

        const hasErrors = results.some((r) => r.status === "rejected");
        if (hasErrors) {
          console.warn("Some images failed to load, but continuing anyway");
        }

        setLoadingState("loaded");
      } catch (error) {
        if (!mounted) return;
        console.error("Failed to load game images:", error);
        setLoadingState("error");
        paddleImageRef.current = null;
        ballImageRef.current = null;
        brickImagesRef.current = [];
      }
    };

    loadAllImages();

    return () => {
      mounted = false;
      paddleImageRef.current = null;
      ballImageRef.current = null;
      brickImagesRef.current = [];
    };
  }, []);

  return {
    paddle: paddleImageRef,
    ball: ballImageRef,
    bricks: brickImagesRef,
    loadingState,
  };
}
