type RepeatMode = "repeat" | "repeat-x" | "repeat-y" | "no-repeat";

export class PatternCache {
  private patterns: Map<string, CanvasPattern | null> = new Map();
  private context: CanvasRenderingContext2D | null = null;

  private getKey(image: CanvasImageSource, repeatMode: RepeatMode): string {
    let imageId: string;
    if (image instanceof HTMLImageElement) {
      imageId = image.src;
    } else if (image instanceof ImageBitmap) {
      imageId = `bitmap:${image.width}x${image.height}`;
    } else {
      imageId = String(image);
    }
    return `${imageId}:${repeatMode}`;
  }

  getPattern(
    ctx: CanvasRenderingContext2D,
    image: CanvasImageSource,
    repeatMode: RepeatMode = "repeat",
  ): CanvasPattern | null {
    if (this.context !== ctx) {
      this.clear();
      this.context = ctx;
    }

    const key = this.getKey(image, repeatMode);
    let pattern = this.patterns.get(key);

    if (pattern === undefined) {
      pattern = ctx.createPattern(image, repeatMode);
      this.patterns.set(key, pattern);
    }

    return pattern;
  }

  clear(): void {
    this.patterns.clear();
    this.context = null;
  }

  clearCache(): void {
    this.clear();
  }

  get size(): number {
    return this.patterns.size;
  }
}
