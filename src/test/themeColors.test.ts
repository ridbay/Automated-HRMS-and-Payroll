import { describe, it, expect, beforeEach } from 'vitest';
import {
  isValidHexColor,
  hexToRgb,
  hexToShadeTokens,
  applyThemeColor,
  getCachedThemeColor,
  CURATED_PRESETS,
  DEFAULT_PRIMARY_COLOR,
} from '../utils/themeColors';

describe('Theme Colors Utility', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.cssText = '';
  });

  it('validates hex colors correctly', () => {
    expect(isValidHexColor('#4F46E5')).toBe(true);
    expect(isValidHexColor('#2563eb')).toBe(true);
    expect(isValidHexColor('#fff')).toBe(true);
    expect(isValidHexColor('#059669')).toBe(true);

    expect(isValidHexColor('blue')).toBe(false);
    expect(isValidHexColor('#12')).toBe(false);
    expect(isValidHexColor('#1234567')).toBe(false);
    expect(isValidHexColor(null)).toBe(false);
    expect(isValidHexColor(undefined)).toBe(false);
  });

  it('converts hex to RGB channels', () => {
    expect(hexToRgb('#4F46E5')).toEqual([79, 70, 229]);
    expect(hexToRgb('#ffffff')).toEqual([255, 255, 255]);
    expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
    expect(hexToRgb('#f00')).toEqual([255, 0, 0]);
  });

  it('generates all 11 Tailwind shade tokens', () => {
    const shades = hexToShadeTokens('#2563EB');
    const expectedStops = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

    for (const stop of expectedStops) {
      expect(shades[stop]).toBeDefined();
      expect(typeof shades[stop]).toBe('string');
      // Format should be "R G B" space-separated numbers
      const channels = shades[stop].split(' ').map(Number);
      expect(channels.length).toBe(3);
      for (const channel of channels) {
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(255);
      }
    }

    // Stop 600 should match base color channels
    expect(shades['600']).toBe('37 99 235');
  });

  it('applies theme variables to document.documentElement and persists to localStorage', () => {
    applyThemeColor('#059669');

    expect(document.documentElement.style.getPropertyValue('--color-primary-600')).toBe('5 150 105');
    expect(document.documentElement.style.getPropertyValue('--brand-primary')).toBe('#059669');
    expect(localStorage.getItem('zenhr_brand_color')).toBe('#059669');
    expect(getCachedThemeColor()).toBe('#059669');
  });

  it('contains 8 valid curated presets', () => {
    expect(CURATED_PRESETS.length).toBe(8);
    for (const preset of CURATED_PRESETS) {
      expect(isValidHexColor(preset.hex)).toBe(true);
      expect(preset.name.length).toBeGreaterThan(0);
      expect(preset.id.length).toBeGreaterThan(0);
    }
  });
});
