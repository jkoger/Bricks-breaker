function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    if ("fetchPriority" in img) {
      (img as any).fetchPriority = "high";
    }
    img.onload = () => resolve(img);
    img.onerror = (error) => {
      reject(
        new Error(`Failed to load image: ${src}. ${error || "Unknown error"}`),
      );
    };

    img.src = src;
  });
}

export async function preloadImage(src: string): Promise<ImageBitmap> {
  if (typeof createImageBitmap === "undefined") {
    throw new Error("createImageBitmap is not supported in this browser");
  }

  try {
    const img = await loadImage(src);
    const imageBitmap = await createImageBitmap(img);
    return imageBitmap;
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error(`Failed to create ImageBitmap from: ${src}`);
  }
}

export function preloadImages(sources: string[]): Promise<ImageBitmap[]> {
  return Promise.all(sources.map((src) => preloadImage(src)));
}

export function preloadImageBitmap(src: string): Promise<ImageBitmap> {
  return preloadImage(src);
}
