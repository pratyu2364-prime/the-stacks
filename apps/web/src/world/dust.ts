import { BufferAttribute, BufferGeometry, Points, PointsMaterial } from 'three';
import { GEOMETRY, PALETTE } from './palette';

export type Dust = { points: Points; update: (delta: number) => void };

export function createDust(count: number, radius: number): Dust {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const r = Math.random() * radius;
    const a = Math.random() * Math.PI * 2;
    positions[i * 3] = Math.cos(a) * r;
    positions[i * 3 + 1] = Math.random() * GEOMETRY.wallHeight;
    positions[i * 3 + 2] = Math.sin(a) * r;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  const points = new Points(
    geometry,
    new PointsMaterial({ color: PALETTE.dust, size: 0.026, transparent: true, opacity: 0.5, depthWrite: false }),
  );

  return {
    points,
    update(delta: number) {
      const array = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i += 1) {
        array[i * 3 + 1] += delta * 0.09;
        if (array[i * 3 + 1] > GEOMETRY.wallHeight) array[i * 3 + 1] = 0;
      }
      geometry.attributes.position.needsUpdate = true;
    },
  };
}
