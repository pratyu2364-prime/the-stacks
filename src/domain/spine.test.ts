import { describe, expect, it } from 'vitest';
import { spineWidth } from './spine';

describe('spineWidth', () => {
  it('is thinnest at zero pages', () => {
    expect(spineWidth(0)).toBeCloseTo(0.09);
  });
  it('is thickest at the cap and stays there beyond it', () => {
    expect(spineWidth(850)).toBeCloseTo(0.25);
    expect(spineWidth(2000)).toBeCloseTo(0.25);
  });
  it('orders books by length', () => {
    expect(spineWidth(824)).toBeGreaterThan(spineWidth(106));
  });
  it('clamps nonsense input instead of going negative', () => {
    expect(spineWidth(-40)).toBeCloseTo(0.09);
  });
});
