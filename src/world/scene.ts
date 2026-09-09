import { Color, Fog, Group, PerspectiveCamera, Scene, WebGLRenderer, ACESFilmicToneMapping, Vector2 } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { DEFAULT_LAYOUT, GENRES, type WorldModel } from '../domain';
import { GEOMETRY, PALETTE } from './palette';
import { createMaterials } from './materials';
import { buildGenreRoom, buildHome } from './rooms';
import { ambientRig, type Flicker } from './lighting';
import { createDust } from './dust';
import { createWalker } from './controls';
import type { BookInfo, BookMesh } from './books';

export type World = {
  dispose: () => void;
  /** Title/author/pages under the crosshair, or null. */
  lookedAt: () => BookInfo | null;
  /** Every titled book in the scene — the E2E hook. */
  books: BookMesh[];
};

declare global {
  interface Window {
    /** The E2E hook: what is actually standing on the shelves right now. */
    __stacks?: { titles: string[] };
  }
}

export function createWorld(canvas: HTMLCanvasElement, model: WorldModel, lite = false): World {
  // A canvas measured before layout reports 0, which makes the aspect NaN and
  // the first frame black. Never trust it below 1px.
  const size = () => ({ w: Math.max(canvas.clientWidth, 1), h: Math.max(canvas.clientHeight, 1) });
  const { w: w0, h: h0 } = size();
  const renderer = new WebGLRenderer({ canvas, antialias: !lite, powerPreference: 'high-performance' });
  renderer.setPixelRatio(lite ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w0, h0, false);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new Scene();
  scene.background = new Color(PALETTE.gloom);
  scene.fog = new Fog(PALETTE.gloom, 8, 46);

  const camera = new PerspectiveCamera(70, w0 / h0, 0.05, 220);
  camera.position.set(0, GEOMETRY.eyeHeight, 2.4);
  scene.add(camera);

  const materials = createMaterials();
  const flickers: Flicker[] = [];
  const books: BookMesh[] = [];
  const root = new Group();
  scene.add(root);

  const openWalls = model.rooms.map((room) => GENRES.indexOf(room.genre));
  buildHome(root, materials, model, openWalls, flickers);
  model.rooms.forEach((room, i) => buildGenreRoom(root, materials, room, openWalls[i], books, flickers));

  for (const light of ambientRig()) scene.add(light);
  const dust = createDust(lite ? 300 : 900, GEOMETRY.homeApothem);
  scene.add(dust.points);

  window.__stacks = { titles: books.map((b) => b.userData.title) };

  const layout = { ...DEFAULT_LAYOUT, openArches: openWalls };
  const walker = createWalker(camera, canvas, layout, books);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  if (!lite) {
    composer.addPass(new UnrealBloomPass(new Vector2(w0, h0), 0.32, 0.6, 0.92));
    composer.addPass(new OutputPass());
  }

  const resize = () => {
    const { w, h } = size();
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
  };
  window.addEventListener('resize', resize);

  let raf = 0;
  let last = performance.now();
  let elapsed = 0;
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    const delta = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += delta;

    walker.update(delta, elapsed);
    dust.update(delta);
    for (const { light, base, phase } of flickers) {
      light.intensity = base * (1 + Math.sin(elapsed * 3.1 + phase) * 0.02 + Math.sin(elapsed * 7.7 + phase) * 0.012);
    }
    composer.render();
  };
  raf = requestAnimationFrame(tick);

  const lock = () => walker.controls.lock();
  canvas.addEventListener('click', lock);

  return {
    books,
    lookedAt: () => {
      const mesh = walker.lookedAt();
      return mesh ? mesh.userData : null;
    },
    dispose() {
      delete window.__stacks;
      cancelAnimationFrame(raf);
      canvas.removeEventListener('click', lock);
      window.removeEventListener('resize', resize);
      walker.dispose();
      composer.dispose();
      renderer.dispose();
      scene.traverse((object) => {
        const mesh = object as { geometry?: { dispose(): void }; material?: unknown };
        mesh.geometry?.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach((m) => (m as { dispose(): void }).dispose());
        else if (material) (material as { dispose(): void }).dispose();
      });
    },
  };
}
