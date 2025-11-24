export class SeededRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  nextFloat(min: number = 0, max: number = 1): number {
    return this.next() * (max - min) + min;
  }

  choose<T>(array: T[]): T {
    return array[this.nextInt(0, array.length)];
  }

  getSeed(): number {
    return this.seed;
  }

  static generateSeed(): number {
    return Date.now() ^ (Math.random() * 0xffffffff);
  }
}
