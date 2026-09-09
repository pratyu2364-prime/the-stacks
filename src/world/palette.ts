/** Lamplit oak. Chosen from three rendered candidates; the others are gone. */
export const PALETTE = {
  gloom: 0x0a0705,
  floor: 0x2c1e13,
  wall: 0x33241a,
  stone: 0x241a12,
  shelf: 0x5a3f26,
  trim: 0x6b4a2b,
  paper: 0xc9bda2,
  lamp: 0xffb45c,
  lampBall: 0xffd79a,
  sconce: 0xff9d45,
  dust: 0xffe0b0,
  spines: [
    0xd98f4a, 0xc96f5c, 0x8fb98a, 0xe0c27a, 0xb58fd4, 0x7b9fd4,
    0xcf8b4f, 0x6fb4b8, 0xa8623c, 0xd8b06a, 0x9c5f4a, 0x7f9b6a,
  ],
} as const;

export const GEOMETRY = {
  homeApothem: 6,
  roomApothem: 5,
  wallHeight: 4.3,
  corridorLength: 5,
  shelfYs: [0.5, 1.27, 2.04, 2.81, 3.58],
  eyeHeight: 1.62,
} as const;

export function hexSide(apothem: number): number {
  return 2 * apothem * Math.tan(Math.PI / 6);
}
