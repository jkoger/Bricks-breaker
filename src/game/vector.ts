import { toDegrees, toRadians } from "../utils";

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

  add(other: Vector | { x: number; y: number }): Vector {
    const otherX = other instanceof Vector ? other.x : other.x;
    const otherY = other instanceof Vector ? other.y : other.y;
    return new Vector(this.x + otherX, this.y + otherY);
  }

  normalize(): Vector {
    return this.scaleBy(1 / this.length());
  }

  subtract(other: Vector | { x: number; y: number }): Vector {
    const otherX = other instanceof Vector ? other.x : other.x;
    const otherY = other instanceof Vector ? other.y : other.y;
    return new Vector(this.x - otherX, this.y - otherY);
  }

  dotProduct(other: Vector | { x: number; y: number }): number {
    const otherX = other instanceof Vector ? other.x : other.x;
    const otherY = other instanceof Vector ? other.y : other.y;
    return this.x * otherX + this.y * otherY;
  }

  projectOn(other: Vector | { x: number; y: number }): Vector {
    const otherX = other instanceof Vector ? other.x : other.x;
    const otherY = other instanceof Vector ? other.y : other.y;
    const otherLength = Math.hypot(otherX, otherY);
    const amt = this.dotProduct(other) / otherLength;
    return new Vector(amt * otherX, amt * otherY);
  }

  reflect(normal: Vector | { x: number; y: number }): Vector {
    return this.subtract(this.projectOn(normal).scaleBy(2));
  }

  rotate(degrees: number): Vector {
    const radians = toRadians(degrees);
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    return new Vector(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
  }

  crossProduct(other: Vector | { x: number; y: number }): number {
    const otherX = other instanceof Vector ? other.x : other.x;
    const otherY = other instanceof Vector ? other.y : other.y;
    return this.x * otherY - otherX * this.y;
  }

  angleBetween(other: Vector | { x: number; y: number }): number {
    return toDegrees(
      Math.atan2(this.crossProduct(other), this.dotProduct(other)),
    );
  }
}
