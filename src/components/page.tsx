import { useRef, useEffect, useState } from "react";

import Scene from "./scene";
import { registerListener } from "../utils";
import bgImage from "../assets/images/bg.png";

interface Size {
  width: number;
  height: number;
}

export default function Page() {
  const sceneContainer = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size | undefined>(undefined);
  const [bgLoaded, setBgLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setBgLoaded(true);
    img.src = bgImage;
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (sceneContainer.current) {
        const { width, height } =
          sceneContainer.current.getBoundingClientRect();
        setSize({ width, height });
      }
    };
    const unregisterResizeListener = registerListener("resize", onResize);
    onResize();
    return unregisterResizeListener;
  }, []);

  return (
    <div
      className="page"
      style={{
        backgroundImage: bgLoaded ? `url(${bgImage})` : undefined,
        backgroundColor: bgLoaded ? undefined : "#000000",
      }}
    >
      <div className="scene-container" ref={sceneContainer}>
        {size && <Scene containerSize={size} />}
      </div>
    </div>
  );
}
