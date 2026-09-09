import { Group, Mesh, Sprite, SpriteMaterial } from 'three';
import { GENRES, type WorldModel } from '../domain';
import { GEOMETRY, hexSide } from './palette';
import { UNIT_BOX, hexPlate, wallAngle, wallPanel } from './geometry';
import { buildBoard, buildStacks, type BookMesh } from './books';
import { labelTexture } from './spineTexture';
import { lightShaft, pendant, sconce, type Flicker } from './lighting';
import type { Materials } from './materials';

function placard(text: string, scale: number, opacity: number): Sprite {
  const sprite = new Sprite(new SpriteMaterial({ map: labelTexture(text), transparent: true, opacity, depthWrite: false }));
  sprite.scale.set(scale, scale * 0.15, 1);
  return sprite;
}

function shell(parent: Group, materials: Materials, apothem: number, archWalls: number[]): void {
  const floor = new Mesh(hexPlate(apothem), materials.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.rotation.z = Math.PI / 6;
  parent.add(floor);

  const ceiling = new Mesh(hexPlate(apothem), materials.stone);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.rotation.z = Math.PI / 6;
  ceiling.position.y = GEOMETRY.wallHeight;
  parent.add(ceiling);

  for (let i = 0; i < 6; i += 1) {
    const angle = wallAngle(i);
    const wall = new Group();
    wall.position.set(Math.cos(angle) * apothem, 0, Math.sin(angle) * apothem);
    wall.lookAt(0, 0, 0); // +Z faces the middle of the room
    wall.add(new Mesh(wallPanel(apothem, archWalls.includes(i)), materials.wall));
    wall.name = `wall-${i}`;
    parent.add(wall);
  }
}

/** The Reading Room: the desk, the lamp, and six arches — bricked up until earned. */
export function buildHome(
  scene: Group,
  materials: Materials,
  model: WorldModel,
  openWalls: number[],
  flickers: Flicker[],
): void {
  const home = new Group();
  scene.add(home);
  shell(home, materials, GEOMETRY.homeApothem, openWalls);
  pendant(home, materials, 55, flickers);
  lightShaft(home);

  for (const wall of openWalls) {
    const genre = GENRES[wall];
    const sign = placard(`${genre.toUpperCase()}  →`, 3, 0.5);
    const angle = wallAngle(wall);
    const r = GEOMETRY.homeApothem - 0.05;
    sign.position.set(Math.cos(angle) * r, 3.68, Math.sin(angle) * r);
    home.add(sign);
  }

  const desk = new Mesh(UNIT_BOX, materials.trim);
  desk.scale.set(1.5, 0.09, 0.95);
  desk.position.set(0, 0.72, -1.85);
  home.add(desk);
  for (const [x, z] of [[-0.65, -1.45], [0.65, -1.45], [-0.65, -2.25], [0.65, -2.25]]) {
    const leg = new Mesh(UNIT_BOX, materials.trim);
    leg.scale.set(0.08, 0.72, 0.08);
    leg.position.set(x, 0.36, z);
    home.add(leg);
  }

  // What you are reading lies on the desk as well as standing on its shelf: a
  // stack of closed books with cloth boards and a paler page block, not the
  // white slabs that shipped first and bloomed like signage.
  let stackHeight = 0;
  model.reading.slice(0, 4).forEach((book, i) => {
    const thickness = 0.05 + book.spineWidth * 0.35;
    const lying = new Group();
    const boards = new Mesh(UNIT_BOX, materials.deskBook);
    boards.scale.set(0.46, thickness, 0.33);
    lying.add(boards);
    const pages = new Mesh(UNIT_BOX, materials.paper);
    pages.scale.set(0.43, thickness * 0.72, 0.305);
    pages.position.x = -0.012;
    lying.add(pages);
    lying.position.set(-0.3 + i * 0.06, 0.765 + stackHeight + thickness / 2, -1.85 + i * 0.04);
    lying.rotation.y = 0.14 - i * 0.09;
    lying.userData = { title: book.title, author: book.author, pages: book.pages };
    home.add(lying);
    stackHeight += thickness + 0.004;
  });
}

/** One hex per genre you own books in, down a lit corridor. */
export function buildGenreRoom(
  scene: Group,
  materials: Materials,
  model: WorldModel['rooms'][number],
  wallIndex: number,
  registry: BookMesh[],
  flickers: Flicker[],
): void {
  const angle = wallAngle(wallIndex);
  const dx = Math.cos(angle);
  const dz = Math.sin(angle);

  const corridor = new Group();
  corridor.position.set(dx * (GEOMETRY.homeApothem + GEOMETRY.corridorLength / 2), 0, dz * (GEOMETRY.homeApothem + GEOMETRY.corridorLength / 2));
  corridor.lookAt(0, 0, 0);
  scene.add(corridor);
  buildStacks(corridor, materials, GEOMETRY.corridorLength, wallIndex * 7919 + 13);

  const floor = new Mesh(UNIT_BOX, materials.floor);
  floor.scale.set(2.6, 0.1, GEOMETRY.corridorLength);
  floor.position.y = -0.05;
  corridor.add(floor);
  const ceiling = new Mesh(UNIT_BOX, materials.stone);
  ceiling.scale.set(2.6, 0.1, GEOMETRY.corridorLength);
  ceiling.position.y = 3.3;
  corridor.add(ceiling);
  for (const side of [-1.3, 1.3]) {
    const wall = new Mesh(UNIT_BOX, materials.wall);
    wall.scale.set(0.2, 3.3, GEOMETRY.corridorLength);
    wall.position.set(side, 1.65, 0);
    corridor.add(wall);
    sconce(corridor, materials, side * 0.62, 2.85, 0, 24, flickers);
  }

  const distance = GEOMETRY.homeApothem + GEOMETRY.corridorLength + GEOMETRY.roomApothem;
  const room = new Group();
  room.position.set(dx * distance, 0, dz * distance);
  room.rotation.y = -angle; // local wall 3 faces back home
  scene.add(room);

  shell(room, materials, GEOMETRY.roomApothem, [3]);
  pendant(room, materials, 40, flickers);
  sconce(room, materials, 0, 2.3, -GEOMETRY.roomApothem + 0.5, 16, flickers);

  const sign = placard(model.genre.toUpperCase(), 3, 0.8);
  sign.position.set(0, 3.9, 0);
  room.add(sign);

  // Five shelved walls, five boards each, in the order the model packed them.
  const span = hexSide(GEOMETRY.roomApothem) - 0.9;
  let board = 0;
  for (let wall = 0; wall < 6; wall += 1) {
    if (wall === 3) continue;
    const wallGroup = room.getObjectByName(`wall-${wall}`) as Group;
    for (const y of GEOMETRY.shelfYs) {
      buildBoard(wallGroup, materials, model.shelves[board] ?? [], y, span, registry);
      board += 1;
    }
  }
}
