/**
 * Deterministic visual QR generator (frontend-only placeholder).
 *
 * This produces a stable, ticket-specific matrix that looks like a real QR code
 * and renders identically across reloads for the same order ID. It is NOT a
 * standards-compliant QR encoding and will not scan at a turnstile.
 *
 * Swap `generateQrMatrix` for a real encoder when the backend issues signed
 * ticket payloads. Everything downstream (the TicketQR component) consumes a
 * plain boolean[][], so the swap is isolated to this file.
 */

const MATRIX_SIZE = 25; // Version 2 proportions
const QUIET_ZONE = 2;
const FINDER_SIZE = 7;
const ALIGNMENT_SIZE = 5;
const ALIGNMENT_CENTER = 18;

/** FNV-1a. Stable across platforms, good enough to seed a PRNG. */
function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32 — small, fast, deterministic PRNG. */
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Regions that must stay readable for the pattern to resemble a QR code. */
function buildReservedMask(): boolean[][] {
  const mask: boolean[][] = Array.from({ length: MATRIX_SIZE }, () =>
    Array.from({ length: MATRIX_SIZE }, () => false)
  );

  const reserve = (startRow: number, startCol: number, size: number) => {
    for (let r = startRow; r < startRow + size; r += 1) {
      for (let c = startCol; c < startCol + size; c += 1) {
        if (r >= 0 && r < MATRIX_SIZE && c >= 0 && c < MATRIX_SIZE) {
          mask[r][c] = true;
        }
      }
    }
  };

  // Finder patterns plus their separators.
  reserve(-1, -1, FINDER_SIZE + 2);
  reserve(-1, MATRIX_SIZE - FINDER_SIZE - 1, FINDER_SIZE + 2);
  reserve(MATRIX_SIZE - FINDER_SIZE - 1, -1, FINDER_SIZE + 2);

  // Alignment pattern in the bottom-right corner.
  reserve(
    ALIGNMENT_CENTER - Math.floor(ALIGNMENT_SIZE / 2),
    ALIGNMENT_CENTER - Math.floor(ALIGNMENT_SIZE / 2),
    ALIGNMENT_SIZE
  );

  // Timing patterns along row and column 6.
  for (let i = 8; i < MATRIX_SIZE - 8; i += 1) {
    mask[6][i] = true;
    mask[i][6] = true;
  }

  // Format information strip.
  for (let i = 0; i < 9; i += 1) {
    mask[8][i] = true;
    mask[i][8] = true;
  }
  for (let i = 0; i < 8; i += 1) {
    mask[8][MATRIX_SIZE - 1 - i] = true;
    mask[MATRIX_SIZE - 1 - i][8] = true;
  }

  return mask;
}

function stampFinder(matrix: boolean[][], startRow: number, startCol: number) {
  for (let r = 0; r < FINDER_SIZE; r += 1) {
    for (let c = 0; c < FINDER_SIZE; c += 1) {
      const isBorder = r === 0 || r === FINDER_SIZE - 1 || c === 0 || c === FINDER_SIZE - 1;
      const isCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      matrix[startRow + r][startCol + c] = isBorder || isCore;
    }
  }
}

function stampAlignment(matrix: boolean[][], center: number) {
  const start = center - Math.floor(ALIGNMENT_SIZE / 2);
  for (let r = 0; r < ALIGNMENT_SIZE; r += 1) {
    for (let c = 0; c < ALIGNMENT_SIZE; c += 1) {
      const isBorder = r === 0 || r === ALIGNMENT_SIZE - 1 || c === 0 || c === ALIGNMENT_SIZE - 1;
      const isCore = r === 2 && c === 2;
      matrix[start + r][start + c] = isBorder || isCore;
    }
  }
}

/**
 * Builds a stable QR-like boolean matrix. `true` means a dark module.
 * Same seed always yields the same pattern.
 */
export function generateQrMatrix(seed: string): boolean[][] {
  const random = createRandom(hashString(seed));
  const reserved = buildReservedMask();

  const matrix: boolean[][] = Array.from({ length: MATRIX_SIZE }, () =>
    Array.from({ length: MATRIX_SIZE }, () => false)
  );

  // Data region: deterministic noise wherever the mask allows it.
  for (let r = 0; r < MATRIX_SIZE; r += 1) {
    for (let c = 0; c < MATRIX_SIZE; c += 1) {
      if (!reserved[r][c]) {
        matrix[r][c] = random() > 0.52;
      }
    }
  }

  // Finder patterns, top-left / top-right / bottom-left.
  stampFinder(matrix, 0, 0);
  stampFinder(matrix, 0, MATRIX_SIZE - FINDER_SIZE);
  stampFinder(matrix, MATRIX_SIZE - FINDER_SIZE, 0);

  // Alignment pattern.
  stampAlignment(matrix, ALIGNMENT_CENTER);

  // Timing patterns.
  for (let i = 8; i < MATRIX_SIZE - 8; i += 1) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Fixed dark module, as the spec requires.
  matrix[MATRIX_SIZE - 8][8] = true;

  return matrix;
}

/** Returns the matrix plus the quiet zone, ready for SVG rendering. */
export function generateQrWithQuietZone(seed: string): {
  matrix: boolean[][];
  totalSize: number;
  quietZone: number;
} {
  const matrix = generateQrMatrix(seed);
  const totalSize = MATRIX_SIZE + QUIET_ZONE * 2;
  return { matrix, totalSize, quietZone: QUIET_ZONE };
}

/**
 * Derives a stable ticket fingerprint from the order payload. Scanners would
 * use a signed token from the backend instead.
 */
export function buildTicketPayload(parts: {
  orderId: string;
  seats: string[];
  totalAmount: number;
  verifyUrl: string;
}): string {
  return [
    'CP1',
    parts.orderId,
    parts.seats.join('-'),
    parts.totalAmount.toFixed(2),
    parts.verifyUrl,
  ].join('|');
}
