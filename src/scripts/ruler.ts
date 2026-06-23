/**
 * Ruler rendering engine — full-page vertical/horizontal ruler.
 * Generates an accurate SVG ruler based on calibration factor.
 */

import { getCurrentPxPerMm } from './calibration';

export type RulerUnit = 'cm' | 'inch';

export interface RulerConfig {
  orientation: 'horizontal' | 'vertical';
  unit: RulerUnit;
  pxPerMm: number;
  totalUnits: number; // total cm or total inches to render
}

/**
 * Calculate how many units (cm or inches) fit in the available space.
 */
export function calcMaxUnits(availablePx: number, unit: RulerUnit, pxPerMm: number): number {
  if (unit === 'cm') {
    const mmAvailable = availablePx / pxPerMm;
    return Math.floor(mmAvailable / 10); // whole centimeters
  } else {
    const inchPx = pxPerMm * 25.4;
    return Math.floor(availablePx / inchPx); // whole inches
  }
}

/**
 * Generate SVG ruler markup for the full-page ruler.
 * The ruler runs along the left edge (vertical) or top edge (horizontal).
 */
export function generateFullPageRulerSVG(config: RulerConfig): string {
  const { orientation, unit, pxPerMm, totalUnits } = config;
  const isHorizontal = orientation === 'horizontal';

  // Calculate total length in pixels
  let totalPx: number;
  if (unit === 'cm') {
    totalPx = totalUnits * 10 * pxPerMm; // totalUnits cm * 10 mm/cm * px/mm
  } else {
    totalPx = totalUnits * 25.4 * pxPerMm; // totalUnits inches * 25.4 mm/inch * px/mm
  }

  const rulerWidth = 60; // thickness of the ruler strip in px
  const svgW = isHorizontal ? totalPx : rulerWidth;
  const svgH = isHorizontal ? rulerWidth : totalPx;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" 
    width="${svgW}" height="${svgH}" 
    viewBox="0 0 ${svgW} ${svgH}"
    role="img" aria-label="Règle de ${totalUnits} ${unit === 'cm' ? 'cm' : 'pouces'}"
    style="display:block;">`;

  // Ruler background line
  if (isHorizontal) {
    svg += `<line x1="0" y1="${rulerWidth - 1}" x2="${svgW}" y2="${rulerWidth - 1}" stroke="#D1D5DB" stroke-width="1"/>`;
  } else {
    svg += `<line x1="${rulerWidth - 1}" y1="0" x2="${rulerWidth - 1}" y2="${svgH}" stroke="#D1D5DB" stroke-width="1"/>`;
  }

  if (unit === 'cm') {
    drawCmTicks(svg, config, isHorizontal, rulerWidth, totalUnits, pxPerMm);
    // Build as string concatenation for performance
    const totalMm = totalUnits * 10;
    for (let mm = 0; mm <= totalMm; mm++) {
      const pos = mm * pxPerMm;
      let tickLen: number;
      let sw: number;
      let color: string;

      if (mm % 10 === 0) {
        tickLen = 36;
        sw = 1.8;
        color = '#1A1A2E';
      } else if (mm % 5 === 0) {
        tickLen = 24;
        sw = 1.2;
        color = '#6B7280';
      } else {
        tickLen = 13;
        sw = 0.7;
        color = '#9CA3AF';
      }

      if (isHorizontal) {
        svg += `<line x1="${pos}" y1="${rulerWidth}" x2="${pos}" y2="${rulerWidth - tickLen}" stroke="${color}" stroke-width="${sw}"/>`;
      } else {
        svg += `<line x1="${rulerWidth}" y1="${pos}" x2="${rulerWidth - tickLen}" y2="${pos}" stroke="${color}" stroke-width="${sw}"/>`;
      }

      // Number each centimeter
      if (mm % 10 === 0 && mm > 0) {
        const cmNum = mm / 10;
        if (isHorizontal) {
          svg += `<text x="${pos}" y="${rulerWidth - tickLen - 6}" text-anchor="middle" font-family="Inter,sans-serif" font-size="14" font-weight="600" fill="#1A1A2E">${cmNum}</text>`;
        } else {
          svg += `<text x="${rulerWidth - tickLen - 8}" y="${pos + 5}" text-anchor="end" font-family="Inter,sans-serif" font-size="14" font-weight="600" fill="#1A1A2E">${cmNum}</text>`;
        }
      }
    }
  } else {
    // Inches — subdivide into 1/16ths
    const totalSixteenths = totalUnits * 16;
    const pxPerSixteenth = (25.4 / 16) * pxPerMm;

    for (let s = 0; s <= totalSixteenths; s++) {
      const pos = s * pxPerSixteenth;
      let tickLen: number;
      let sw: number;
      let color: string;

      if (s % 16 === 0) {
        // Whole inch
        tickLen = 36;
        sw = 1.8;
        color = '#1A1A2E';
      } else if (s % 8 === 0) {
        // Half inch
        tickLen = 28;
        sw = 1.4;
        color = '#374151';
      } else if (s % 4 === 0) {
        // Quarter inch
        tickLen = 20;
        sw = 1.0;
        color = '#6B7280';
      } else if (s % 2 === 0) {
        // Eighth inch
        tickLen = 14;
        sw = 0.8;
        color = '#9CA3AF';
      } else {
        // Sixteenth inch
        tickLen = 9;
        sw = 0.5;
        color = '#D1D5DB';
      }

      if (isHorizontal) {
        svg += `<line x1="${pos}" y1="${rulerWidth}" x2="${pos}" y2="${rulerWidth - tickLen}" stroke="${color}" stroke-width="${sw}"/>`;
      } else {
        svg += `<line x1="${rulerWidth}" y1="${pos}" x2="${rulerWidth - tickLen}" y2="${pos}" stroke="${color}" stroke-width="${sw}"/>`;
      }

      // Number each inch
      if (s % 16 === 0 && s > 0) {
        const inchNum = s / 16;
        if (isHorizontal) {
          svg += `<text x="${pos}" y="${rulerWidth - tickLen - 6}" text-anchor="middle" font-family="Inter,sans-serif" font-size="14" font-weight="600" fill="#1A1A2E">${inchNum}</text>`;
        } else {
          svg += `<text x="${rulerWidth - tickLen - 8}" y="${pos + 5}" text-anchor="end" font-family="Inter,sans-serif" font-size="14" font-weight="600" fill="#1A1A2E">${inchNum}</text>`;
        }
      }
    }
  }

  svg += '</svg>';
  return svg;
}

// Placeholder — actual tick drawing is inline above
function drawCmTicks(..._args: any[]) {}

/**
 * Generate a printable ruler SVG at exactly the right size for print (96 DPI).
 */
export function generatePrintRulerSVG(lengthCm: number): string {
  const pxPerMm = 96 / 25.4;
  const totalPx = lengthCm * 10 * pxPerMm;
  const rulerWidth = 80;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" 
    width="${totalPx}" height="${rulerWidth}" 
    viewBox="0 0 ${totalPx} ${rulerWidth}"
    role="img" aria-label="Règle de ${lengthCm} cm"
    style="display:block;">`;

  // Background
  svg += `<rect x="0" y="0" width="${totalPx}" height="${rulerWidth}" fill="#FFFFFF" rx="4" ry="4" stroke="#D1D5DB" stroke-width="1"/>`;

  const totalMm = lengthCm * 10;
  for (let mm = 0; mm <= totalMm; mm++) {
    const pos = mm * pxPerMm;
    let tickLen: number;
    let sw: number;
    let color: string;

    if (mm % 10 === 0) {
      tickLen = 36;
      sw = 1.8;
      color = '#000';
    } else if (mm % 5 === 0) {
      tickLen = 24;
      sw = 1.2;
      color = '#333';
    } else {
      tickLen = 14;
      sw = 0.8;
      color = '#666';
    }

    svg += `<line x1="${pos}" y1="0" x2="${pos}" y2="${tickLen}" stroke="${color}" stroke-width="${sw}"/>`;

    if (mm % 10 === 0) {
      const cmNum = mm / 10;
      svg += `<text x="${pos}" y="${tickLen + 18}" text-anchor="middle" font-family="Inter,sans-serif" font-size="14" font-weight="600" fill="#000">${cmNum}</text>`;
    }
  }

  svg += `<text x="${totalPx - 8}" y="${rulerWidth - 8}" text-anchor="end" font-family="Inter,sans-serif" font-size="11" font-weight="500" fill="#999">cm / mm</text>`;
  svg += '</svg>';
  return svg;
}
