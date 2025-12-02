import { useState, useEffect } from "react";
import type { Movement } from "../../game/core";

interface MobileControlsProps {
  onMove: (movement: Movement | null) => void;
  isPaused: boolean;
  isGameActive: boolean;
}

export default function MobileControls({
  onMove,
  isPaused,
  isGameActive,
}: MobileControlsProps) {
  const [isMobile, setIsMobile] = useState(false);

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

  if (!isMobile || !isGameActive) {
    return null;
  }

  const handleTouchStart = (
    e: React.TouchEvent | React.MouseEvent,
    movement: Movement,
  ) => {
    e.stopPropagation();
    if (!isPaused) {
      onMove(movement);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    onMove(null);
  };

  return (
    <div
      className="mobile-controls"
      style={{
        position: "absolute",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: "20px",
        zIndex: 100,
        pointerEvents: isPaused ? "none" : "auto",
        opacity: isPaused ? 0.5 : 1,
      }}
    >
      <button
        className="mobile-control-button mobile-control-button-left"
        onTouchStart={(e) => handleTouchStart(e, "LEFT")}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={(e) => handleTouchStart(e, "LEFT")}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        aria-label="Move left"
      >
        ←
      </button>
      <button
        className="mobile-control-button mobile-control-button-right"
        onTouchStart={(e) => handleTouchStart(e, "RIGHT")}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={(e) => handleTouchStart(e, "RIGHT")}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        aria-label="Move right"
      >
        →
      </button>
    </div>
  );
}
