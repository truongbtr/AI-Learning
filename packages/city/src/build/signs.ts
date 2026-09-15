// Text on buildings (letters, numbers, words, city names) shares ONE texture atlas so every sign in
// the city is a single draw call. The atlas only allocates cells here; drawing needs a canvas, which
// the engine provides in the browser. In tests the painter is a no-op.

import { Float32BufferAttribute, Mesh, PlaneGeometry } from "three";
import { tok } from "./kit";

export interface SignStyle {
  bg: string | null;
  fg: string;
  stroke?: string;
  /** Wide cells for words, square cells for single letters/numbers. */
  wide?: boolean;
}

export interface SignCell {
  u0: number;
  v0: number;
  u1: number;
  v1: number;
}

export type SignPainter = (
  text: string,
  style: SignStyle,
  x: number,
  y: number,
  w: number,
  h: number,
) => void;

export const ATLAS_SIZE = 2048;
const CELL = 128;

export class SignAtlas {
  private readonly cells = new Map<string, SignCell>();
  private cursorX = 0;
  private cursorY = 0;
  version = 0;

  constructor(private readonly paint: SignPainter = () => {}) {}

  cell(text: string, style: SignStyle): SignCell {
    const key = `${text}|${style.bg}|${style.fg}|${style.stroke ?? ""}|${style.wide ? 1 : 0}`;
    const hit = this.cells.get(key);
    if (hit) return hit;
    const w = style.wide ? CELL * 4 : CELL;
    if (this.cursorX + w > ATLAS_SIZE) {
      this.cursorX = 0;
      this.cursorY += CELL;
    }
    if (this.cursorY + CELL > ATLAS_SIZE) {
      // full: reuse the first cell rather than failing the whole city
      const first = this.cells.values().next().value;
      if (first) return first;
    }
    const x = this.cursorX;
    const y = this.cursorY;
    this.cursorX += w;
    this.paint(text, style, x, y, w, CELL);
    const inset = 1;
    const cell: SignCell = {
      u0: (x + inset) / ATLAS_SIZE,
      u1: (x + w - inset) / ATLAS_SIZE,
      // canvas y grows downward; texture v grows upward (flipY)
      v1: 1 - (y + inset) / ATLAS_SIZE,
      v0: 1 - (y + CELL - inset) / ATLAS_SIZE,
    };
    this.cells.set(key, cell);
    this.version++;
    return cell;
  }
}

/** A sign panel facing +z, UV-mapped into the atlas. */
export function sign(atlas: SignAtlas, text: string, style: SignStyle, width: number): Mesh {
  const cell = atlas.cell(text, style);
  const height = style.wide ? width / 4 : width;
  const g = new PlaneGeometry(width, height);
  g.setAttribute(
    "uv",
    new Float32BufferAttribute(
      [cell.u0, cell.v1, cell.u1, cell.v1, cell.u0, cell.v0, cell.u1, cell.v0],
      2,
    ),
  );
  return new Mesh(g, tok(0xffffff, "sign"));
}

/** Browser painter: rounded background + bold centred text, Vietnamese diacritics included. */
export function canvasPainter(ctx: CanvasRenderingContext2D): SignPainter {
  return (text, style, x, y, w, h) => {
    ctx.save();
    ctx.clearRect(x, y, w, h);
    if (style.bg) {
      ctx.fillStyle = style.bg;
      ctx.beginPath();
      ctx.roundRect(x + 4, y + 4, w - 8, h - 8, 26);
      ctx.fill();
    }
    let size = h * 0.7;
    ctx.font = `900 ${size}px "Baloo 2", "Nunito", "Segoe UI", Arial, sans-serif`;
    while (ctx.measureText(text).width > w - 20 && size > 20) {
      size -= 4;
      ctx.font = `900 ${size}px "Baloo 2", "Nunito", "Segoe UI", Arial, sans-serif`;
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (style.stroke) {
      ctx.lineWidth = size * 0.12;
      ctx.strokeStyle = style.stroke;
      ctx.strokeText(text, x + w / 2, y + h / 2 + size * 0.05);
    }
    ctx.fillStyle = style.fg;
    ctx.fillText(text, x + w / 2, y + h / 2 + size * 0.05);
    ctx.restore();
  };
}
