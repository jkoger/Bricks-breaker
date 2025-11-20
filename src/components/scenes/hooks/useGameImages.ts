import { useEffect, useRef } from "react";
import paddleImageSrc from "../../../assets/images/paddle.png";
import ballImageSrc from "../../../assets/images/ball.png";
import brick1ImageSrc from "../../../assets/images/brick.png";
import brick2ImageSrc from "../../../assets/images/brick1.png";

interface GameImages {
  paddle: React.RefObject<HTMLImageElement | null>;
  ball: React.RefObject<HTMLImageElement | null>;
  bricks: React.RefObject<HTMLImageElement[]>;
}

export function useGameImages(): GameImages {
  const paddleImageRef = useRef<HTMLImageElement | null>(null);
  const ballImageRef = useRef<HTMLImageElement | null>(null);
  const brickImagesRef = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
    const img = new Image();
    img.src = paddleImageSrc;
    const handleLoad = () => {
      paddleImageRef.current = img;
    };
    img.addEventListener("load", handleLoad);
    return () => {
      img.removeEventListener("load", handleLoad);
      paddleImageRef.current = null;
    };
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = ballImageSrc;
    const handleLoad = () => {
      ballImageRef.current = img;
    };
    img.addEventListener("load", handleLoad);
    return () => {
      img.removeEventListener("load", handleLoad);
      ballImageRef.current = null;
    };
  }, []);

  useEffect(() => {
    const sources = [brick1ImageSrc, brick2ImageSrc];
    const images: HTMLImageElement[] = [];
    let mounted = true;
    let remaining = sources.length;

    sources.forEach((src, index) => {
      const img = new Image();
      img.src = src;
      const handleLoad = () => {
        if (!mounted) return;
        images[index] = img;
        remaining -= 1;
        if (remaining === 0) {
          brickImagesRef.current = images;
        }
      };
      img.addEventListener("load", handleLoad);
      img.addEventListener("error", handleLoad);
    });

    return () => {
      mounted = false;
      brickImagesRef.current = [];
    };
  }, []);

  return {
    paddle: paddleImageRef,
    ball: ballImageRef,
    bricks: brickImagesRef,
  };
}
