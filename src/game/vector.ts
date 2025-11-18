export default class Vector {
  constructor(
    public x: number,
    public y: number,
  ) {}

  scaleBy(number: number): Vector {
    return new Vector(this.x * number, this.y * number);
  }

  length(): number {
    return Math.hypot(this.x, this.y);
  }

  add({ x, y }: { x: number; y: number }): Vector {
    return new Vector(this.x + x, this.y + y);
  }

  normalize(): Vector {
    return this.scaleBy(1 / this.length());
  }
}
