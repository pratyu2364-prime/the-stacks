import { BoxGeometry, CircleGeometry, ExtrudeGeometry, Path, Shape } from 'three';
import { GEOMETRY, hexSide } from './palette';

export const UNIT_BOX = new BoxGeometry(1, 1, 1);

export function hexPlate(apothem: number): CircleGeometry {
  return new CircleGeometry(apothem / Math.cos(Math.PI / 6), 6);
}

/** A wall panel, optionally with an arched doorway cut out of it. */
export function wallPanel(apothem: number, withArch: boolean): ExtrudeGeometry {
  const half = hexSide(apothem) / 2;
  const h = GEOMETRY.wallHeight;
  const shape = new Shape();
  shape.moveTo(-half, 0);
  shape.lineTo(half, 0);
  shape.lineTo(half, h);
  shape.lineTo(-half, h);
  shape.lineTo(-half, 0);

  if (withArch) {
    const hw = 1.15;
    const hy = 2.05;
    const hole = new Path();
    hole.moveTo(-hw, 0);
    hole.lineTo(-hw, hy);
    hole.absarc(0, hy, hw, Math.PI, 0, true);
    hole.lineTo(hw, 0);
    hole.lineTo(-hw, 0);
    shape.holes.push(hole);
  }

  const geometry = new ExtrudeGeometry(shape, { depth: 0.4, bevelEnabled: false });
  geometry.translate(0, 0, -0.4);
  return geometry;
}

export function wallAngle(index: number): number {
  return (index * Math.PI) / 3;
}
