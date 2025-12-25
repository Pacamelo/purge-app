/**
 * Hilbert Curve Utility
 *
 * Space-filling curve for converting 1D data into 2D visualization.
 * Preserves locality - nearby elements in 1D stay nearby in 2D.
 *
 * Used for entropy heat map visualization where we want to display
 * sequential file bytes in a 2D grid that maintains spatial relationships.
 *
 * References:
 * - https://en.wikipedia.org/wiki/Hilbert_curve
 * - https://corte.si/posts/visualisation/entropy/
 */

/**
 * Convert a 1D index (d) to 2D coordinates (x, y) on a Hilbert curve.
 *
 * @param n - Grid size (must be power of 2, e.g., 16, 32, 64)
 * @param d - 1D index (0 to n*n-1)
 * @returns 2D coordinates {x, y} where 0 <= x,y < n
 */
export function hilbertD2XY(n: number, d: number): { x: number; y: number } {
  if (n <= 0 || (n & (n - 1)) !== 0) {
    throw new Error('Grid size n must be a positive power of 2');
  }
  if (d < 0 || d >= n * n) {
    throw new Error(`Index d must be between 0 and ${n * n - 1}`);
  }

  let x = 0;
  let y = 0;
  let s = 1;
  let rx: number;
  let ry: number;
  let t = d;

  while (s < n) {
    rx = 1 & (t >> 1);
    ry = 1 & (t ^ rx);

    // Rotate quadrant
    if (ry === 0) {
      if (rx === 1) {
        x = s - 1 - x;
        y = s - 1 - y;
      }
      // Swap x and y
      [x, y] = [y, x];
    }

    x += s * rx;
    y += s * ry;
    t = Math.floor(t / 4);
    s *= 2;
  }

  return { x, y };
}

/**
 * Convert 2D coordinates (x, y) to a 1D index (d) on a Hilbert curve.
 *
 * @param n - Grid size (must be power of 2, e.g., 16, 32, 64)
 * @param x - X coordinate (0 to n-1)
 * @param y - Y coordinate (0 to n-1)
 * @returns 1D index d where 0 <= d < n*n
 */
export function hilbertXY2D(n: number, x: number, y: number): number {
  if (n <= 0 || (n & (n - 1)) !== 0) {
    throw new Error('Grid size n must be a positive power of 2');
  }
  if (x < 0 || x >= n || y < 0 || y >= n) {
    throw new Error(`Coordinates must be between 0 and ${n - 1}`);
  }

  let d = 0;
  let s = n >> 1;
  let rx: number;
  let ry: number;
  let tempX = x;
  let tempY = y;

  while (s > 0) {
    rx = (tempX & s) > 0 ? 1 : 0;
    ry = (tempY & s) > 0 ? 1 : 0;
    d += s * s * ((3 * rx) ^ ry);

    // Rotate quadrant
    if (ry === 0) {
      if (rx === 1) {
        tempX = s - 1 - tempX;
        tempY = s - 1 - tempY;
      }
      [tempX, tempY] = [tempY, tempX];
    }

    s >>= 1;
  }

  return d;
}

/**
 * Calculate the optimal grid size for a given number of blocks.
 * Returns the smallest power of 2 that can fit all blocks.
 *
 * @param blockCount - Number of blocks to fit
 * @returns Power of 2 grid size (e.g., 16, 32, 64)
 */
export function getOptimalGridSize(blockCount: number): number {
  if (blockCount <= 0) return 1;

  // Find smallest power of 2 where n*n >= blockCount
  let n = 1;
  while (n * n < blockCount) {
    n *= 2;
  }

  return n;
}

/**
 * Generate all 2D coordinates for a Hilbert curve of given size.
 * Useful for pre-computing layout.
 *
 * @param n - Grid size (must be power of 2)
 * @returns Array of {x, y, d} coordinates in Hilbert order
 */
export function generateHilbertPath(
  n: number
): Array<{ x: number; y: number; d: number }> {
  const path: Array<{ x: number; y: number; d: number }> = [];
  const total = n * n;

  for (let d = 0; d < total; d++) {
    const { x, y } = hilbertD2XY(n, d);
    path.push({ x, y, d });
  }

  return path;
}

/**
 * Map a block index to canvas pixel coordinates.
 *
 * @param blockIndex - Index of the entropy block
 * @param gridSize - Hilbert curve grid size
 * @param canvasSize - Canvas width/height in pixels
 * @returns Pixel coordinates {px, py} and cell size
 */
export function blockToCanvasCoords(
  blockIndex: number,
  gridSize: number,
  canvasSize: number
): { px: number; py: number; cellSize: number } {
  const { x, y } = hilbertD2XY(gridSize, Math.min(blockIndex, gridSize * gridSize - 1));
  const cellSize = canvasSize / gridSize;

  return {
    px: x * cellSize,
    py: y * cellSize,
    cellSize,
  };
}
