import { useEffect, useState } from "react";
import logoImage from "../../assets/images/logo.webp";
import buttonImage from "../../assets/images/button.webp";
import Button from "./button";

interface StartScreenProps {
  width: number;
  height: number;
  onStart: () => void;
}

export default function StartScreen({
  width,
  height,
  onStart,
}: StartScreenProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    let logoLoaded = false;
    let buttonLoaded = false;

    const checkAllLoaded = () => {
      if (logoLoaded && buttonLoaded) {
        setImagesLoaded(true);
      }
    };

    const logoImg = new Image();
    logoImg.onload = () => {
      logoLoaded = true;
      checkAllLoaded();
    };
    logoImg.onerror = () => {
      logoLoaded = true;
      checkAllLoaded();
    };
    logoImg.src = logoImage;

    const buttonImg = new Image();
    buttonImg.onload = () => {
      buttonLoaded = true;
      checkAllLoaded();
    };
    buttonImg.onerror = () => {
      buttonLoaded = true;
      checkAllLoaded();
    };
    buttonImg.src = buttonImage;
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        ) || window.innerWidth < 768,
      );
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!imagesLoaded) {
    return (
      <div
        className="overlay-screen"
        style={
          {
            width,
            height,
            "--container-width": `${width}px`,
          } as React.CSSProperties
        }
      />
    );
  }

  return (
    <div
      className="overlay-screen"
      style={
        {
          width,
          height,
          "--container-width": `${width}px`,
        } as React.CSSProperties
      }
    >
      <img src={logoImage} alt="Bricks Breaker" className="logo" />
      {isMobile ? (
        <>
          <p className="overlay-text">Touch and drag to move the paddle</p>
          <p className="overlay-text">Double tap to pause</p>
        </>
      ) : (
        <>
          <p className="overlay-text">Use ← → or A D to move the paddle</p>
          <p className="overlay-text">Press SPACE to pause</p>
        </>
      )}
      <Button onClick={onStart}>START GAME</Button>
      <p className="overlay-footer">
        © 2025 J. Adamson — Bricks Breaker demo for portfolio.
      </p>
    </div>
  );
}
