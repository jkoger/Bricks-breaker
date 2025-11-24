import { useEffect, useRef, useState } from "react";
import paddleImageSrc from "../../../assets/images/paddle.png";
import ballImageSrc from "../../../assets/images/ball.png";
import brick1ImageSrc from "../../../assets/images/brick.png";
import brick2ImageSrc from "../../../assets/images/brick1.png";
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

        const [paddleImg, ballImg, brickImgs] = await Promise.all([
          preloadImage(paddleImageSrc),
          preloadImage(ballImageSrc),
          preloadImages([brick1ImageSrc, brick2ImageSrc]),
        ]);

        if (!mounted) return;

        paddleImageRef.current = paddleImg;
        ballImageRef.current = ballImg;
        brickImagesRef.current = brickImgs;
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
