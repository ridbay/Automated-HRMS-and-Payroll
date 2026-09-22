/**
 * Utility for dynamic runtime branding color generation.
 * Generates Tailwind-compatible 50..950 RGB color tokens from any hex color code.
 */

export interface ColorPreset {
  id: string;
  name: string;
  hex: string;
  description: string;
}

export const CURATED_PRESETS: ColorPreset[] = [
  { id: 'indigo', name: 'Indigo Classic', hex: '#4F46E5', description: 'Original ZenHR violet-blue' },
  { id: 'blue', name: 'Royal Sapphire', hex: '#2563EB', description: 'Classic enterprise blue' },
  { id: 'emerald', name: 'Emerald Forest', hex: '#059669', description: 'Confident fintech green' },
  { id: 'purple', name: 'Amethyst Violet', hex: '#7C3AED', description: 'Modern, innovative violet' },
  { id: 'rose', name: 'Ruby Crimson', hex: '#E11D48', description: 'Vibrant, high-energy rose' },
  { id: 'amber', name: 'Sunset Amber', hex: '#D97706', description: 'Warm, executive amber' },
  { id: 'teal', name: 'Oceanic Teal', hex: '#0D9488', description: 'Crisp, contemporary teal' },
  { id: 'slate', name: 'Charcoal Slate', hex: '#475569', description: 'Minimalist, sleek slate' },
];

export const DEFAULT_PRIMARY_COLOR = '#4F46E5';

/**
 * Validates a 3 or 6 digit hex color code.
 */
export const isValidHexColor = (hex?: string | null): boolean => {
  if (!hex) return false;
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex.trim());
};

/**
 * Converts a hex string into normalized RGB components [r, g, b] (0..255).
 */
export const hexToRgb = (hex: string): [number, number, number] => {
  let clean = hex.trim().replace(/^#/, '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const intVal = parseInt(clean, 16);
  if (isNaN(intVal)) return [79, 70, 229]; // Fallback to #4F46E5
  return [(intVal >> 16) & 255, (intVal >> 8) & 255, intVal & 255];
};

/**
 * Converts RGB components [0..255] to HSL [h (0..360), s (0..1), l (0..1)].
 */
const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return [h, s, l];
};

/**
 * Converts HSL components to RGB [0..255].
 */
const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
};

/**
 * Computes a full 50..950 Tailwind shade palette for a given base hex color.
 * Returns space-separated RGB channel strings suitable for `rgb(var(--color) / <alpha>)`.
 */
export const hexToShadeTokens = (hex: string): Record<string, string> => {
  const validHex = isValidHexColor(hex) ? hex : DEFAULT_PRIMARY_COLOR;
  const [baseR, baseG, baseB] = hexToRgb(validHex);
  const [h, s] = rgbToHsl(baseR, baseG, baseB);

  // Targets for lightness at each scale step
  const shadeLightness: Record<string, number> = {
    '50': 0.96,
    '100': 0.92,
    '200': 0.84,
    '300': 0.72,
    '400': 0.58,
    '500': 0.48,
    '600': 0.40, // Base level
    '700': 0.32,
    '800': 0.24,
    '900': 0.17,
    '950': 0.10,
  };

  const tokens: Record<string, string> = {};

  for (const [shade, targetL] of Object.entries(shadeLightness)) {
    if (shade === '600') {
      // Exact input base color for 600
      tokens[shade] = `${baseR} ${baseG} ${baseB}`;
    } else {
      // Tune saturation slightly for very light shades to prevent unnatural oversaturation
      const adjustedS = shade === '50' || shade === '100' ? Math.min(s, 0.85) : s;
      const [r, g, b] = hslToRgb(h, adjustedS, targetL);
      tokens[shade] = `${r} ${g} ${b}`;
    }
  }

  return tokens;
};

/**
 * Injects CSS variables onto document.documentElement so that all Tailwind
 * utility classes (`bg-indigo-600`, `text-indigo-600`, etc.) immediately adapt.
 */
export const applyThemeColor = (hex: string): void => {
  if (typeof document === 'undefined') return;

  const validHex = isValidHexColor(hex) ? hex : DEFAULT_PRIMARY_COLOR;
  const shades = hexToShadeTokens(validHex);

  const root = document.documentElement;
  for (const [shade, rgbString] of Object.entries(shades)) {
    root.style.setProperty(`--color-primary-${shade}`, rgbString);
  }

  // Also set direct hex variables for standard CSS usage
  root.style.setProperty('--brand-primary', validHex);
  const [r, g, b] = hexToRgb(validHex);
  root.style.setProperty('--brand-primary-rgb', `${r}, ${g}, ${b}`);

  try {
    localStorage.setItem('zenhr_brand_color', validHex);
  } catch {
    // Ignore localStorage failures in sandboxed/iframe contexts
  }
};

/**
 * Retrieves the stored or default theme color on initial load.
 */
export const getCachedThemeColor = (): string => {
  if (typeof window === 'undefined') return DEFAULT_PRIMARY_COLOR;
  try {
    const saved = localStorage.getItem('zenhr_brand_color');
    if (saved && isValidHexColor(saved)) return saved;
  } catch {}
  return DEFAULT_PRIMARY_COLOR;
};
