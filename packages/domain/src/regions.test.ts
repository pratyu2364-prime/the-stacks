import { describe, expect, it } from 'vitest';
import { DEFAULT_LAYOUT, archAngle, isInsideWorld, roomCentre, roomCentreDistance } from './regions';
import type { WorldLayout } from './regions';

const layout: WorldLayout = { ...DEFAULT_LAYOUT, openArches: [0, 2, 4] };

describe('isInsideWorld', () => {
  it('allows the middle of the reading room', () => {
    expect(isInsideWorld({ x: 0, z: 0 }, layout)).toBe(true);
  });

  it('refuses a point outside every region', () => {
    expect(isInsideWorld({ x: 0, z: 40 }, layout)).toBe(false);
  });

  it('refuses walking through a wall with no arch', () => {
    const a = archAngle(1); // wall 1 is shelved, not a door
    const p = { x: Math.cos(a) * 9, z: Math.sin(a) * 9 };
    expect(isInsideWorld(p, layout)).toBe(false);
  });

  it('allows the middle of every genre room', () => {
    for (const wall of layout.openArches) {
      expect(isInsideWorld(roomCentre(layout, wall), layout)).toBe(true);
    }
  });

  // The doorway bug: walk the whole path in 5cm steps and assert no gap.
  it('walks from the reading room into every genre room with no invisible wall', () => {
    const end = roomCentreDistance(layout);
    for (const wall of layout.openArches) {
      const a = archAngle(wall);
      for (let t = 0; t <= end; t += 0.05) {
        const p = { x: Math.cos(a) * t, z: Math.sin(a) * t };
        expect({ wall, t: Number(t.toFixed(2)), legal: isInsideWorld(p, layout) }).toEqual({
          wall,
          t: Number(t.toFixed(2)),
          legal: true,
        });
      }
    }
  });

  it('keeps the walker out of the corridor walls', () => {
    const a = archAngle(0);
    const t = layout.homeApothem + 2;
    const across = layout.corridorHalfWidth + 0.2;
    const p = { x: Math.cos(a) * t - Math.sin(a) * across, z: Math.sin(a) * t + Math.cos(a) * across };
    expect(isInsideWorld(p, layout)).toBe(false);
  });

  it('opens nothing when no arches are open', () => {
    const closed = { ...DEFAULT_LAYOUT, openArches: [] };
    expect(isInsideWorld({ x: 0, z: 0 }, closed)).toBe(true);
    expect(isInsideWorld(roomCentre(closed, 0), closed)).toBe(false);
  });
});
