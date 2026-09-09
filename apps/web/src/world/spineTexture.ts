import { CanvasTexture, Color, SRGBColorSpace } from 'three';

/**
 * A book spine as a canvas: cloth ground, gilt rules, title and author set
 * vertically. One texture per titled book — the budget is 400 on screen, which
 * is why the stacks beyond your rooms are instanced and untitled instead.
 */
export function spineTexture(title: string, author: string, colorHex: number): CanvasTexture {
  const w = 128;
  const h = 384;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d');
  if (!g) throw new Error('2d canvas unavailable');

  g.fillStyle = `#${new Color(colorHex).getHexString()}`;
  g.fillRect(0, 0, w, h);

  g.globalAlpha = 0.12;
  for (let i = 0; i < 260; i += 1) {
    g.fillStyle = i % 2 === 0 ? '#000' : '#fff';
    g.fillRect(Math.random() * w, Math.random() * h, 1, 2);
  }
  g.globalAlpha = 1;

  g.strokeStyle = 'rgba(255,225,170,0.75)';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(14, 34);
  g.lineTo(w - 14, 34);
  g.moveTo(14, h - 34);
  g.lineTo(w - 14, h - 34);
  g.stroke();

  g.save();
  g.translate(w / 2, h / 2);
  g.rotate(-Math.PI / 2);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = 'rgba(255,232,190,0.96)';

  let size = 30;
  g.font = `600 ${size}px Georgia, serif`;
  while (g.measureText(title).width > h - 96 && size > 13) {
    size -= 1;
    g.font = `600 ${size}px Georgia, serif`;
  }
  g.fillText(title, 0, -6);

  g.font = `400 ${Math.max(12, size - 10)}px Georgia, serif`;
  g.fillStyle = 'rgba(255,232,190,0.62)';
  g.fillText(author, 0, size * 0.95);
  g.restore();

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Flat text on a transparent ground, for doorway and room placards. */
export function labelTexture(text: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 96;
  const g = canvas.getContext('2d');
  if (!g) throw new Error('2d canvas unavailable');
  g.font = '600 46px ui-monospace, Menlo, monospace';
  g.fillStyle = '#ffd9a8';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 320, 52);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
