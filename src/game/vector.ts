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

  add(other: Vector): Vector {
    return new Vector(this.x + other.x, this.y + other.y);
  }

  normalize(): Vector {
    return this.scaleBy(1 / this.length());
  }

  subtract(other: Vector): Vector {
    return new Vector(this.x - other.x, this.y - other.y);
  }

  dotProduct(other: Vector): number {
    return this.x * other.x + this.y * other.y;
  }

  projectOn(other: Vector): Vector {
    const otherLength = Math.hypot(other.x, other.y);
    const amt = this.dotProduct(other) / otherLength;
    return new Vector(amt * other.x, amt * other.y);
  }

  reflect(normal: Vector): Vector {
    return this.subtract(this.projectOn(normal).scaleBy(2));
  }

  rotate(degrees: number): Vector {
    const radians = toRadians(degrees);
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    return new Vector(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
  }

  crossProduct(other: Vector): number {
    return this.x * other.y - other.x * this.y;
  }

  angleBetween(other: Vector): number {
    return toDegrees(
      Math.atan2(this.crossProduct(other), this.dotProduct(other)),
    );
  }
}
