/** Spine width in metres, from page count. Fat spine always means long book. */
export function spineWidth(pages: number): number {
  const clamped = Math.min(Math.max(pages, 0), 850);
  return 0.09 + (clamped / 850) * 0.16;
}
