/**
 * Calibration system for the online ruler.
 * Supports auto-calibration, screen diagonal, and credit card reference.
 * Persists calibration factor in localStorage.
 */

const STORAGE_KEY = 'regle_calibration';

export interface CalibrationData {
  factor: number;        // CSS pixels per mm
  method: 'auto' | 'diagonal' | 'card' | 'default';
  diagonalInches: number;
  timestamp: number;
}

/**
 * Get the default CSS pixels per mm based on the assumption of 96 DPI.
 * CSS spec: 1in = 96px, 1in = 25.4mm → 1mm ≈ 3.7795px
 */
export function getDefaultPxPerMm(): number {
  return 96 / 25.4; // ≈ 3.7795
}

/**
 * Load saved calibration from localStorage.
 */
export function loadCalibration(): CalibrationData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const data = JSON.parse(stored) as CalibrationData;
    if (data && typeof data.factor === 'number' && data.factor > 0) {
      return data;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

/**
 * Save calibration to localStorage.
 */
export function saveCalibration(data: CalibrationData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage might be unavailable
  }
}

/**
 * Reset calibration (remove from localStorage).
 */
export function resetCalibration(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Get the current pixels-per-mm factor, using saved calibration if available.
 */
export function getCurrentPxPerMm(): number {
  const saved = loadCalibration();
  return saved ? saved.factor : getDefaultPxPerMm();
}

/**
 * Calculate px-per-mm from a diagonal in inches.
 */
function calcPxPerMmFromDiagonal(diagonalInches: number): number {
  const dpr = window.devicePixelRatio || 1;
  const physicalWidth = window.screen.width * dpr;
  const physicalHeight = window.screen.height * dpr;
  const diagonalPx = Math.sqrt(physicalWidth ** 2 + physicalHeight ** 2);
  const physicalPPI = diagonalPx / diagonalInches;
  const cssPPI = physicalPPI / dpr;
  return cssPPI / 25.4;
}

/**
 * Auto-calibrate using the detected screen diagonal.
 * Called automatically on first visit.
 */
export function autoCalibrate(detectedDiagonalInches: number): CalibrationData {
  const pxPerMm = calcPxPerMmFromDiagonal(detectedDiagonalInches);

  const data: CalibrationData = {
    factor: pxPerMm,
    method: 'auto',
    diagonalInches: detectedDiagonalInches,
    timestamp: Date.now(),
  };

  saveCalibration(data);
  return data;
}

/**
 * Calibrate using screen diagonal size in inches (manual input).
 */
export function calibrateByDiagonal(diagonalInches: number): CalibrationData {
  const pxPerMm = calcPxPerMmFromDiagonal(diagonalInches);

  const data: CalibrationData = {
    factor: pxPerMm,
    method: 'diagonal',
    diagonalInches,
    timestamp: Date.now(),
  };

  saveCalibration(data);
  return data;
}

/**
 * Calibrate using a credit card reference.
 * Standard card width: 85.6mm.
 */
export function calibrateByCard(cardWidthPx: number): CalibrationData {
  const CARD_WIDTH_MM = 85.6;
  const pxPerMm = cardWidthPx / CARD_WIDTH_MM;

  const data: CalibrationData = {
    factor: pxPerMm,
    method: 'card',
    diagonalInches: 0,
    timestamp: Date.now(),
  };

  saveCalibration(data);
  return data;
}
