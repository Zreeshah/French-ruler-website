/**
 * Device detection utilities for the ruler tool.
 * Detects screen type, orientation, touch capability, viewport size,
 * and auto-estimates screen diagonal in inches.
 */

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  estimatedDiagonalInches: number;
  deviceName: string;
}

/**
 * Common device database mapping (width x height @ DPR) → diagonal inches.
 * Uses CSS pixels * DPR = physical resolution for matching.
 */
const DEVICE_DB: Array<{ w: number; h: number; dpr: number; diag: number; name: string }> = [
  // iPhones
  { w: 430, h: 932, dpr: 3, diag: 6.7, name: 'iPhone Pro Max' },
  { w: 393, h: 852, dpr: 3, diag: 6.1, name: 'iPhone Pro' },
  { w: 390, h: 844, dpr: 3, diag: 6.1, name: 'iPhone 14' },
  { w: 375, h: 812, dpr: 3, diag: 5.8, name: 'iPhone X/11 Pro' },
  { w: 414, h: 896, dpr: 3, diag: 6.5, name: 'iPhone 11 Pro Max' },
  { w: 414, h: 896, dpr: 2, diag: 6.1, name: 'iPhone 11/XR' },
  { w: 375, h: 667, dpr: 2, diag: 4.7, name: 'iPhone SE/8' },
  { w: 320, h: 568, dpr: 2, diag: 4.0, name: 'iPhone SE 1st' },
  // iPads
  { w: 1024, h: 1366, dpr: 2, diag: 12.9, name: 'iPad Pro 12.9"' },
  { w: 834, h: 1194, dpr: 2, diag: 11.0, name: 'iPad Pro 11"' },
  { w: 820, h: 1180, dpr: 2, diag: 10.9, name: 'iPad Air' },
  { w: 810, h: 1080, dpr: 2, diag: 10.2, name: 'iPad 10.2"' },
  { w: 744, h: 1133, dpr: 2, diag: 8.3, name: 'iPad mini' },
  // Samsung Galaxy
  { w: 412, h: 915, dpr: 2.625, diag: 6.6, name: 'Galaxy S23' },
  { w: 360, h: 800, dpr: 3, diag: 6.5, name: 'Galaxy S21' },
  { w: 412, h: 914, dpr: 3.5, diag: 6.8, name: 'Galaxy S24 Ultra' },
  { w: 384, h: 854, dpr: 2.81, diag: 6.4, name: 'Galaxy S22' },
  { w: 360, h: 780, dpr: 3, diag: 6.5, name: 'Galaxy A' },
  // Pixel
  { w: 412, h: 915, dpr: 2.625, diag: 6.3, name: 'Pixel 7' },
  { w: 411, h: 823, dpr: 2.6, diag: 5.7, name: 'Pixel 5' },
  { w: 393, h: 873, dpr: 2.75, diag: 6.1, name: 'Pixel 6' },
  // Common laptops / monitors
  { w: 1920, h: 1080, dpr: 1, diag: 15.6, name: 'Ordinateur portable 15.6"' },
  { w: 1920, h: 1080, dpr: 1.25, diag: 14.0, name: 'Ordinateur portable 14"' },
  { w: 1536, h: 864, dpr: 1.25, diag: 15.6, name: 'Ordinateur portable 15.6" HD+' },
  { w: 1440, h: 900, dpr: 2, diag: 13.3, name: 'MacBook Air 13"' },
  { w: 1512, h: 982, dpr: 2, diag: 14.2, name: 'MacBook Pro 14"' },
  { w: 1728, h: 1117, dpr: 2, diag: 16.2, name: 'MacBook Pro 16"' },
  { w: 1470, h: 956, dpr: 2, diag: 15.3, name: 'MacBook Air 15"' },
  { w: 2560, h: 1440, dpr: 1, diag: 27.0, name: 'Moniteur 27"' },
  { w: 1920, h: 1080, dpr: 1, diag: 24.0, name: 'Moniteur 24"' },
  { w: 3840, h: 2160, dpr: 2, diag: 27.0, name: 'Moniteur 27" 4K' },
];

/**
 * Try to match the current device to a known device in the database.
 * Returns the matched entry or null.
 */
function matchDevice(screenW: number, screenH: number, dpr: number): { diag: number; name: string } | null {
  // Normalize so width <= height for comparison
  const w = Math.min(screenW, screenH);
  const h = Math.max(screenW, screenH);

  for (const device of DEVICE_DB) {
    const dw = Math.min(device.w, device.h);
    const dh = Math.max(device.w, device.h);
    const dprClose = Math.abs(dpr - device.dpr) < 0.3;
    const wClose = Math.abs(w - dw) <= 10;
    const hClose = Math.abs(h - dh) <= 20;
    if (wClose && hClose && dprClose) {
      return { diag: device.diag, name: device.name };
    }
  }
  return null;
}

/**
 * Estimate screen diagonal from resolution and a rough PPI guess.
 * This is a fallback when no device match is found.
 */
function estimateDiagonal(screenW: number, screenH: number, dpr: number): number {
  const physW = screenW * dpr;
  const physH = screenH * dpr;
  const diagPx = Math.sqrt(physW ** 2 + physH ** 2);

  // Rough PPI estimation based on device type
  let estimatedPPI: number;
  const isMobile = Math.min(screenW, screenH) < 768;
  const isTablet = !isMobile && Math.min(screenW, screenH) < 1200 && dpr >= 2;

  if (isMobile) {
    estimatedPPI = 460; // Most phones are 400-520 PPI
  } else if (isTablet) {
    estimatedPPI = 264; // iPads and tablets ~264 PPI
  } else {
    estimatedPPI = 110; // Desktop monitors ~96-120 PPI
  }

  return Math.round((diagPx / estimatedPPI) * 100) / 100;
}

export function detectDevice(): DeviceInfo {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const devicePixelRatio = window.devicePixelRatio || 1;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isLandscape = viewportWidth > viewportHeight;

  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1024;
  const isDesktop = viewportWidth >= 1024;

  // Try to match known device
  const matched = matchDevice(screenWidth, screenHeight, devicePixelRatio);
  const estimatedDiagonalInches = matched
    ? matched.diag
    : estimateDiagonal(screenWidth, screenHeight, devicePixelRatio);
  const deviceName = matched ? matched.name : 'Inconnu';

  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    isLandscape,
    isPortrait: !isLandscape,
    screenWidth,
    screenHeight,
    viewportWidth,
    viewportHeight,
    devicePixelRatio,
    estimatedDiagonalInches,
    deviceName,
  };
}

export function onOrientationChange(callback: (device: DeviceInfo) => void): () => void {
  const handler = () => {
    // Small delay to let the viewport settle after orientation change
    setTimeout(() => {
      callback(detectDevice());
    }, 150);
  };

  window.addEventListener('resize', handler);

  if (screen.orientation) {
    screen.orientation.addEventListener('change', handler);
  }

  return () => {
    window.removeEventListener('resize', handler);
    if (screen.orientation) {
      screen.orientation.removeEventListener('change', handler);
    }
  };
}
