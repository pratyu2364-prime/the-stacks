import { MeshBasicMaterial, MeshStandardMaterial } from 'three';
import { PALETTE } from './palette';

export function createMaterials() {
  return {
    floor: new MeshStandardMaterial({ color: PALETTE.floor, roughness: 0.95 }),
    wall: new MeshStandardMaterial({ color: PALETTE.wall, roughness: 0.95 }),
    stone: new MeshStandardMaterial({ color: PALETTE.stone, roughness: 1 }),
    shelf: new MeshStandardMaterial({ color: PALETTE.shelf, roughness: 0.8 }),
    trim: new MeshStandardMaterial({ color: PALETTE.trim, roughness: 0.7 }),
    // Bloom threshold is 0.92; a near-white diffuse under the lamp still blew
    // out, so the page is a dimmer cream and fully rough.
    paper: new MeshStandardMaterial({ color: PALETTE.paper, roughness: 1 }),
    deskBook: new MeshStandardMaterial({ color: 0x8f5a3c, roughness: 0.95 }),
    stock: new MeshStandardMaterial({ roughness: 0.9 }),
    glow: new MeshBasicMaterial({ color: PALETTE.lampBall }),
  };
}

export type Materials = ReturnType<typeof createMaterials>;
