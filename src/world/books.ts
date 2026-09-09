import { BoxGeometry, Color, Group, InstancedMesh, Mesh, MeshStandardMaterial, Object3D } from 'three';
import type { ShelvedBook } from '../domain';
import { PALETTE } from './palette';
import { UNIT_BOX } from './geometry';
import { spineTexture } from './spineTexture';
import type { Materials } from './materials';

export type BookInfo = { title: string; author: string; pages: number };
export type BookMesh = Mesh & { userData: BookInfo };

/**
 * One board of your books: the shelf plank, the titled spines packed left to
 * right, and a bookend where your reading stopped. The empty space to the right
 * of the bookend is the point — it is the honest part of the room.
 */
export function buildBoard(
  parent: Group,
  materials: Materials,
  books: ShelvedBook[],
  y: number,
  span: number,
  registry: BookMesh[],
): void {
  const board = new Mesh(UNIT_BOX, materials.shelf);
  board.scale.set(span, 0.075, 0.36);
  board.position.set(0, y, 0.2);
  parent.add(board);

  const backing = new Mesh(UNIT_BOX, materials.stone);
  backing.scale.set(span, 0.72, 0.03);
  backing.position.set(0, y + 0.4, 0.03);
  parent.add(backing);

  let x = -span / 2 + 0.06;
  books.forEach((book, i) => {
    const height = 0.3 + Math.min(book.pages, 850) / 850 * 0.14;
    const depth = 0.22;
    const colour = PALETTE.spines[(registry.length * 5 + 3) % PALETTE.spines.length];
    const face = new MeshStandardMaterial({ map: spineTexture(book.title, book.author, colour), roughness: 0.78 });
    const side = new MeshStandardMaterial({ color: colour, roughness: 0.85 });
    const edge = new MeshStandardMaterial({ color: 0xd9cdb4, roughness: 0.95 });

    const mesh = new Mesh(new BoxGeometry(book.spineWidth, height, depth), [side, side, edge, edge, face, side]) as unknown as BookMesh;
    mesh.position.set(x + book.spineWidth / 2, y + 0.037 + height / 2, 0.2 + depth / 2 - 0.02);
    if (i % 9 === 8) mesh.rotation.z = 0.08;
    mesh.userData = { title: book.title, author: book.author, pages: book.pages };
    parent.add(mesh);
    registry.push(mesh);
    x += book.spineWidth + 0.012;
  });

  if (books.length > 0) {
    const bookend = new Mesh(UNIT_BOX, materials.trim);
    bookend.scale.set(0.05, 0.3, 0.24);
    bookend.position.set(x + 0.05, y + 0.19, 0.31);
    parent.add(bookend);
  }
}

/**
 * The stacks: catalogue you have not claimed, lining both walls of the corridor
 * you walk to reach your own room. One draw call, dim and untitled, so "mine"
 * versus "not mine yet" needs no label to read.
 */
export function buildStacks(corridor: Group, materials: Materials, length: number, seed: number): void {
  const rows = [0.62, 1.55, 2.48];
  const span = length - 0.4;
  const capacity = 2 * rows.length * 60;

  const stock = new InstancedMesh(UNIT_BOX, materials.stock, capacity);
  const dummy = new Object3D();
  const colour = new Color();
  let random = seed;
  const next = () => {
    random = (random * 1664525 + 1013904223) % 4294967296;
    return random / 4294967296;
  };

  let n = 0;
  for (const side of [-1, 1]) {
    const x = side * 1.02;
    for (const y of rows) {
      const plank = new Mesh(UNIT_BOX, materials.shelf);
      plank.scale.set(0.3, 0.07, span);
      plank.position.set(x, y, 0);
      corridor.add(plank);

      let z = -span / 2;
      while (z < span / 2 - 0.12 && n < capacity) {
        const w = 0.085 + next() * 0.11;
        const h = 0.26 + next() * 0.2;
        dummy.position.set(x, y + 0.035 + h / 2, z + w / 2);
        dummy.rotation.set(0, Math.PI / 2, 0);
        dummy.scale.set(w, h, 0.2);
        dummy.updateMatrix();
        stock.setMatrixAt(n, dummy.matrix);
        colour.setHex(PALETTE.spines[n % PALETTE.spines.length]).multiplyScalar(0.5).offsetHSL(0, -0.3, 0);
        stock.setColorAt(n, colour);
        n += 1;
        z += w + 0.01;
      }
    }
  }

  stock.count = n;
  stock.instanceMatrix.needsUpdate = true;
  if (stock.instanceColor) stock.instanceColor.needsUpdate = true;
  corridor.add(stock);
}
