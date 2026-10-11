import React, { useMemo } from 'react';

const MATRIX_SIZE = 25;
const QUIET_ZONE = 2;
const FINDER_SIZE = 7;
const ALIGNMENT_SIZE = 5;
const ALIGNMENT_CENTER = 18;

function hashString(input) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function createRandom(seed) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildReservedMask() {
  const mask = Array.from({ length: MATRIX_SIZE }, () =>
    Array.from({ length: MATRIX_SIZE }, () => false)
  );

  const reserve = (startRow, startCol, size) => {
    for (let r = startRow; r < startRow + size; r += 1) {
      for (let c = startCol; c < startCol + size; c += 1) {
        if (r >= 0 && r < MATRIX_SIZE && c >= 0 && c < MATRIX_SIZE) {
          mask[r][c] = true;
        }
      }
    }
  };

  reserve(-1, -1, FINDER_SIZE + 2);
  reserve(-1, MATRIX_SIZE - FINDER_SIZE - 1, FINDER_SIZE + 2);
  reserve(MATRIX_SIZE - FINDER_SIZE - 1, -1, FINDER_SIZE + 2);

  reserve(
    ALIGNMENT_CENTER - Math.floor(ALIGNMENT_SIZE / 2),
    ALIGNMENT_CENTER - Math.floor(ALIGNMENT_SIZE / 2),
    ALIGNMENT_SIZE
  );

  for (let i = 8; i < MATRIX_SIZE - 8; i += 1) {
    mask[6][i] = true;
    mask[i][6] = true;
  }

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

function stampFinder(matrix, startRow, startCol) {
  for (let r = 0; r < FINDER_SIZE; r += 1) {
    for (let c = 0; c < FINDER_SIZE; c += 1) {
      const isBorder = r === 0 || r === FINDER_SIZE - 1 || c === 0 || c === FINDER_SIZE - 1;
      const isCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      matrix[startRow + r][startCol + c] = isBorder || isCore;
    }
  }
}

function stampAlignment(matrix, center) {
  const start = center - Math.floor(ALIGNMENT_SIZE / 2);
  for (let r = 0; r < ALIGNMENT_SIZE; r += 1) {
    for (let c = 0; c < ALIGNMENT_SIZE; c += 1) {
      const isBorder = r === 0 || r === ALIGNMENT_SIZE - 1 || c === 0 || c === ALIGNMENT_SIZE - 1;
      const isCore = r === 2 && c === 2;
      matrix[start + r][start + c] = isBorder || isCore;
    }
  }
}

function generateQrMatrix(seed) {
  const random = createRandom(hashString(seed));
  const reserved = buildReservedMask();

  const matrix = Array.from({ length: MATRIX_SIZE }, () =>
    Array.from({ length: MATRIX_SIZE }, () => false)
  );

  for (let r = 0; r < MATRIX_SIZE; r += 1) {
    for (let c = 0; c < MATRIX_SIZE; c += 1) {
      if (!reserved[r][c]) {
        matrix[r][c] = random() > 0.52;
      }
    }
  }

  stampFinder(matrix, 0, 0);
  stampFinder(matrix, 0, MATRIX_SIZE - FINDER_SIZE);
  stampFinder(matrix, MATRIX_SIZE - FINDER_SIZE, 0);

  stampAlignment(matrix, ALIGNMENT_CENTER);

  for (let i = 8; i < MATRIX_SIZE - 8; i += 1) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  matrix[MATRIX_SIZE - 8][8] = true;

  return matrix;
}

export const TicketQr = ({ payload, size = 180, label }) => {
  const matrix = useMemo(() => generateQrMatrix(payload || 'CINEPASS'), [payload]);
  const totalDim = MATRIX_SIZE + QUIET_ZONE * 2;

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-inner">
      <svg
        viewBox={`0 0 ${totalDim} ${totalDim}`}
        width={size}
        height={size}
        className="shape-rendering-crispEdges"
      >
        <rect width={totalDim} height={totalDim} fill="#ffffff" />
        {matrix.map((row, r) =>
          row.map((cell, c) => {
            if (!cell) return null;
            return (
              <rect
                key={`${r}-${c}`}
                x={c + QUIET_ZONE}
                y={r + QUIET_ZONE}
                width={1}
                height={1}
                fill="#000000"
              />
            );
          })
        )}
      </svg>
      {label && (
        <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-800 mt-2 uppercase">
          {label}
        </span>
      )}
    </div>
  );
};
