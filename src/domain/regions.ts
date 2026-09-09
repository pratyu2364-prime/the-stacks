/**
 * Where the walker is allowed to stand. Region-based, not mesh-based: a point is
 * legal if it is inside the home hex, inside a corridor, or inside a genre hex.
 *
 * The regions MUST overlap. The first prototype left a 30cm gap between the end
 * of a corridor and the start of a room, which read as an invisible wall in
 * every doorway. `regions.test.ts` walks the whole path to keep that fixed.
 */

export type Point = { x: number; z: number };

export type WorldLayout = {
  /** Home hex apothem: wall distance from the centre. */
  homeApothem: number;
  /** Genre hex apothem. */
  roomApothem: number;
  /** Corridor length between the two walls it joins. */
  corridorLength: number;
  /** Corridor half-width the walker may use. */
  corridorHalfWidth: number;
  /** How far the walker must stay off a wall. */
  clearance: number;
  /** Wall indices (0..5) that have a doorway, in the order rooms were opened. */
  openArches: number[];
};

export const DEFAULT_LAYOUT: WorldLayout = {
  homeApothem: 6,
  roomApothem: 5,
  corridorLength: 5,
  corridorHalfWidth: 1.0,
  clearance: 0.6,
  openArches: [],
};

export function archAngle(wallIndex: number): number {
  return (wallIndex * Math.PI) / 3;
}

/** Distance from the origin to the centre of a genre room. */
export function roomCentreDistance(l: WorldLayout): number {
  return l.homeApothem + l.corridorLength + l.roomApothem;
}

export function roomCentre(l: WorldLayout, wallIndex: number): Point {
  const d = roomCentreDistance(l);
  const a = archAngle(wallIndex);
  return { x: Math.cos(a) * d, z: Math.sin(a) * d };
}

export function isInsideWorld(p: Point, l: WorldLayout): boolean {
  if (Math.hypot(p.x, p.z) < l.homeApothem - l.clearance) return true;

  for (const wall of l.openArches) {
    const a = archAngle(wall);
    const dx = Math.cos(a);
    const dz = Math.sin(a);
    const along = p.x * dx + p.z * dz;
    const across = Math.abs(-p.x * dz + p.z * dx);

    // Corridor. Starts inside the home hex and ends inside the room, so both
    // joins overlap rather than meet.
    const corridorStart = l.homeApothem - l.clearance - 0.5;
    const corridorEnd = l.homeApothem + l.corridorLength + l.roomApothem * 0.5;
    if (along > corridorStart && along < corridorEnd && across < l.corridorHalfWidth) return true;

    const c = roomCentre(l, wall);
    if (Math.hypot(p.x - c.x, p.z - c.z) < l.roomApothem - l.clearance) return true;
  }
  return false;
}
