import React, { useMemo } from 'react';
import { generateQrWithQuietZone } from '../utils/qrGenerator';
/**
 * Renders a deterministic QR-style matrix as SVG.
 *
 * Frontend-only placeholder: the pattern is stable per seed but is not a
 * standards-compliant encoding, so it will not scan. Replace the generator to
 * make it functional.
 */
export const TicketQr = ({ seed, size = 200, className = '' }) => {
    const { matrix, totalSize, quietZone } = useMemo(() => generateQrWithQuietZone(seed), [seed]);
    return (<svg width={size} height={size} viewBox={`0 0 ${totalSize} ${totalSize}`} shapeRendering="crispEdges" className={className} role="img" aria-label="Ticket QR code">
      <rect width={totalSize} height={totalSize} fill="#ffffff"/>
      {matrix.map((row, rowIndex) => row.map((isDark, colIndex) => isDark ? (<rect key={`${rowIndex}-${colIndex}`} x={colIndex + quietZone} y={rowIndex + quietZone} width={1} height={1} fill="#000000"/>) : null))}
    </svg>);
};
