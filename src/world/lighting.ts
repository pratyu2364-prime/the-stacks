import {
  AmbientLight,
  CylinderGeometry,
  DoubleSide,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PointLight,
  SphereGeometry,
  AdditiveBlending,
} from 'three';
import { GEOMETRY, PALETTE } from './palette';
import { UNIT_BOX } from './geometry';
import type { Materials } from './materials';

export type Flicker = { light: PointLight; base: number; phase: number };

export function ambientRig(): [AmbientLight, HemisphereLight] {
  return [new AmbientLight(0x50331f, 0.85), new HemisphereLight(0x6b4a2b, 0x120c08, 0.5)];
}

/** The hanging lamp at the centre of a room, plus its visible bulb and cord. */
export function pendant(parent: Group, materials: Materials, power: number, flickers: Flicker[]): void {
  const y = 2.8;
  const light = new PointLight(PALETTE.lamp, power, 30, 2);
  light.position.set(0, y, 0);
  parent.add(light);

  const bulb = new Mesh(new SphereGeometry(0.16, 20, 14), materials.glow);
  bulb.position.copy(light.position);
  parent.add(bulb);

  const cord = new Mesh(new CylinderGeometry(0.012, 0.012, GEOMETRY.wallHeight - y, 6), materials.trim);
  cord.position.set(0, y + (GEOMETRY.wallHeight - y) / 2, 0);
  parent.add(cord);

  flickers.push({ light, base: power, phase: flickers.length * 1.7 });
}

/** A wall sconce. Corridors get these so the way out is never a black hole. */
export function sconce(
  parent: Group,
  materials: Materials,
  x: number,
  y: number,
  z: number,
  power: number,
  flickers: Flicker[],
): void {
  const cup = new Mesh(UNIT_BOX, materials.trim);
  cup.scale.set(0.12, 0.16, 0.12);
  cup.position.set(x, y - 0.16, z);
  parent.add(cup);

  const bulb = new Mesh(new SphereGeometry(0.085, 14, 10), materials.glow);
  bulb.position.set(x, y, z);
  parent.add(bulb);

  const light = new PointLight(PALETTE.sconce, power, 12, 2);
  light.position.set(x, y, z);
  parent.add(light);

  flickers.push({ light, base: power, phase: flickers.length * 1.7 });
}

/** The shaft of light the dust hangs in. Cosmetic, and the room dies without it. */
export function lightShaft(parent: Group): void {
  const shaft = new Mesh(
    new CylinderGeometry(0.8, 2.6, GEOMETRY.wallHeight, 24, 1, true),
    new MeshBasicMaterial({
      color: 0xffd9a0,
      transparent: true,
      opacity: 0.05,
      side: DoubleSide,
      depthWrite: false,
      blending: AdditiveBlending,
    }),
  );
  shaft.position.set(0, GEOMETRY.wallHeight / 2, 0);
  parent.add(shaft);
}
