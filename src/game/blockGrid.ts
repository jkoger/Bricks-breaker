import Vector from "./vector";
import type { Block } from "./core";

const BLOCK_HEIGHT = 1 / 3;

export class BlockGrid {
  private grid: (Block | null)[][];
  private rows: number;
  private cols: number;
  private blocksStartY: number;
  private activeCount: number;

  constructor(rows: number, cols: number, blocksStartY: number) {
    this.rows = rows;
    this.cols = cols;
    this.blocksStartY = blocksStartY;
    this.grid = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(null));
    this.activeCount = 0;
  }

  setBlock(row: number, col: number, block: Block): void {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return;
    }
    const wasActive = (this.grid[row][col]?.density ?? 0) > 0;
    const isActive = block.density > 0;

    if (wasActive && !isActive) {
      this.activeCount -= 1;
    } else if (!wasActive && isActive) {
      this.activeCount += 1;
    }

    this.grid[row][col] = block;
  }

  updateBlockDensity(
    row: number,
    col: number,
    newDensity: number,
    hitAt?: number,
  ): void {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return;
    }

    const block = this.grid[row][col];
    if (!block) {
      return;
    }

    const wasActive = block.density > 0;
    const isActive = newDensity > 0;

    if (wasActive && !isActive) {
      this.activeCount -= 1;
    } else if (!wasActive && isActive) {
      this.activeCount += 1;
    }
    block.density = newDensity;
    if (hitAt !== undefined) {
      block.hitAt = hitAt;
    }
  }

  setBlockDensityToZero(row: number, col: number): void {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return;
    }

    const block = this.grid[row][col];
    if (!block) {
      return;
    }

    const wasActive = block.density > 0;

    if (wasActive) {
      this.activeCount -= 1;
    }

    block.density = 0;
  }

  getBlock(row: number, col: number): Block | null {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return null;
    }
    return this.grid[row][col];
  }

  worldToGrid(x: number, y: number): { row: number; col: number } | null {
    const col = Math.floor(x);
    const row = Math.floor((y - this.blocksStartY) / BLOCK_HEIGHT);

    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return null;
    }
    return { row, col };
  }

  getCellsForBall(
    ballCenter: Vector,
    radius: number,
  ): Array<{ row: number; col: number }> {
    const cells: Array<{ row: number; col: number }> = [];
    const minCell = this.worldToGrid(
      ballCenter.x - radius,
      ballCenter.y - radius,
    );
    const maxCell = this.worldToGrid(
      ballCenter.x + radius,
      ballCenter.y + radius,
    );

    if (!minCell || !maxCell) {
      return cells;
    }

    for (let row = minCell.row; row <= maxCell.row; row += 1) {
      for (let col = minCell.col; col <= maxCell.col; col += 1) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
          cells.push({ row, col });
        }
      }
    }

    return cells;
  }

  forEachActiveBlock(callback: (block: Block) => void): void {
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        const block = this.grid[row][col];
        if (block && block.density > 0) {
          callback(block);
        }
      }
    }
  }

  toFlatArray(): Block[] {
    const blocks: Block[] = [];
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        const block = this.grid[row][col];
        if (block && block.density > 0) {
          blocks.push(block);
        }
      }
    }
    return blocks;
  }

  getActiveCount(): number {
    return this.activeCount;
  }
}
