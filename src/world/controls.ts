import { PerspectiveCamera, Raycaster, Vector2 } from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { isInsideWorld, type WorldLayout } from '../domain';
import { GEOMETRY } from './palette';
import type { BookMesh } from './books';

export type Walker = {
  controls: PointerLockControls;
  update: (delta: number, elapsed: number) => void;
  lookedAt: () => BookMesh | null;
  dispose: () => void;
};

const WALK = 2.9;
const HURRY = 6.2;

/**
 * Pointer-lock walking. Collision is the domain's region test, not meshes: an
 * illegal step is simply not taken. Regions overlap by design, which is what
 * keeps doorways passable.
 */
export function createWalker(
  camera: PerspectiveCamera,
  domElement: HTMLElement,
  layout: WorldLayout,
  books: BookMesh[],
): Walker {
  const controls = new PointerLockControls(camera, domElement);
  const keys = new Set<string>();
  const raycaster = new Raycaster();
  const centre = new Vector2(0, 0);
  let looked: BookMesh | null = null;
  let lookTimer = 0;
  let idle = 0;

  const down = (e: KeyboardEvent) => keys.add(e.code);
  const up = (e: KeyboardEvent) => keys.delete(e.code);
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);

  return {
    controls,
    update(delta, elapsed) {
      if (!controls.isLocked) {
        // Slow drift so the room shows itself before anyone touches a key.
        idle += delta;
        camera.position.set(Math.sin(idle * 0.08) * 2.2, GEOMETRY.eyeHeight, Math.cos(idle * 0.08) * 2.2);
        camera.lookAt(Math.sin(idle * 0.08 + 2.5) * 4, 2, Math.cos(idle * 0.08 + 2.5) * 4);
        looked = null;
        return;
      }

      const speed = (keys.has('ShiftLeft') || keys.has('ShiftRight') ? HURRY : WALK) * delta;
      const previous = camera.position.clone();
      if (keys.has('KeyW') || keys.has('ArrowUp')) controls.moveForward(speed);
      if (keys.has('KeyS') || keys.has('ArrowDown')) controls.moveForward(-speed);
      if (keys.has('KeyA') || keys.has('ArrowLeft')) controls.moveRight(-speed);
      if (keys.has('KeyD') || keys.has('ArrowRight')) controls.moveRight(speed);
      if (!isInsideWorld({ x: camera.position.x, z: camera.position.z }, layout)) camera.position.copy(previous);
      camera.position.y = GEOMETRY.eyeHeight + Math.sin(elapsed * 7) * 0.012;

      lookTimer -= delta;
      if (lookTimer <= 0) {
        lookTimer = 0.12;
        raycaster.setFromCamera(centre, camera);
        const hit = raycaster.intersectObjects(books, false)[0];
        looked = hit && hit.distance < 3.2 ? (hit.object as BookMesh) : null;
      }
    },
    lookedAt: () => looked,
    dispose() {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      controls.dispose();
    },
  };
}
