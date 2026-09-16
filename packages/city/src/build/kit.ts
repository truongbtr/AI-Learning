// Geometry kit for city builders. Builders compose a normal three.js scene graph out of these
// helpers; nothing here is rendered directly — `bake()` merges everything by chunk and surface kind
// into a few vertex-coloured meshes. Materials here are only *tokens* carrying colour + kind.

import {
  BoxGeometry,
  BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  IcosahedronGeometry,
  type Material,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  type Shape,
  SphereGeometry,
  TorusGeometry,
} from "three";

/** Surface kinds — one draw call per kind per chunk. */
export type SurfaceKind = "solid" | "glass" | "light" | "water" | "sign" | "ghost" | "cloud";

export interface TokenData {
  kind: SurfaceKind;
  color: number;
  /** Faceted look (trees, rocks, clouds): face normals are computed when baking. */
  flat: boolean;
  /** Geometry already carries per-vertex colours (Kenney). */
  vertexColors: boolean;
}

const tokens = new Map<string, MeshBasicMaterial>();

export function tok(color: number, kind: SurfaceKind = "solid", flat = false): MeshBasicMaterial {
  const key = `${color}|${kind}|${flat}`;
  let m = tokens.get(key);
  if (!m) {
    m = new MeshBasicMaterial({ color });
    const data: TokenData = { kind, color, flat, vertexColors: false };
    m.userData = data;
    tokens.set(key, m);
  }
  return m;
}

export const vertexColorToken = (kind: SurfaceKind = "solid"): MeshBasicMaterial => {
  const key = `vc|${kind}`;
  let m = tokens.get(key);
  if (!m) {
    m = new MeshBasicMaterial({ vertexColors: true });
    const data: TokenData = { kind, color: 0xffffff, flat: false, vertexColors: true };
    m.userData = data;
    tokens.set(key, m);
  }
  return m;
};

export function tokenOf(material: Material | Material[]): TokenData {
  const m = Array.isArray(material) ? material[0] : material;
  const data = m?.userData as Partial<TokenData> | undefined;
  return {
    kind: data?.kind ?? "solid",
    color: data?.color ?? 0xff00ff,
    flat: data?.flat ?? false,
    vertexColors: data?.vertexColors ?? false,
  };
}

type ColorOrToken = number | MeshBasicMaterial;
const asToken = (c: ColorOrToken) => (typeof c === "number" ? tok(c) : c);

const geoCache = new Map<string, BufferGeometry>();
function cached<T extends BufferGeometry>(key: string, make: () => T): T {
  let g = geoCache.get(key);
  if (!g) {
    g = make();
    geoCache.set(key, g);
  }
  return g as T;
}
const k = (...n: number[]) => n.map((v) => v.toFixed(3)).join("|");

function mesh(geometry: BufferGeometry, c: ColorOrToken): Mesh {
  return new Mesh(geometry, asToken(c));
}

export function box(w: number, h: number, d: number, c: ColorOrToken): Mesh {
  return mesh(
    cached(`box${k(w, h, d)}`, () => new BoxGeometry(w, h, d)),
    c,
  );
}

/**
 * Box with its four vertical edges chamfered — reads as a soft toy block from the city camera at
 * 28 triangles (a rounded box costs 108).
 */
export function cbox(w: number, h: number, d: number, c: ColorOrToken, chamfer = 0.12): Mesh {
  return mesh(
    cached(`cbox${k(w, h, d, chamfer)}`, () =>
      chamferBoxGeometry(w, h, d, Math.min(chamfer, w / 3, d / 3)),
    ),
    c,
  );
}

function chamferBoxGeometry(w: number, h: number, d: number, c: number): BufferGeometry {
  const x = w / 2;
  const z = d / 2;
  const ring: [number, number][] = [
    [x - c, z],
    [x, z - c],
    [x, -z + c],
    [x - c, -z],
    [-x + c, -z],
    [-x, -z + c],
    [-x, z - c],
    [-x + c, z],
  ];
  const pos: number[] = [];
  const nor: number[] = [];
  const y0 = -h / 2;
  const y1 = h / 2;
  for (let i = 0; i < 8; i++) {
    const a = ring[i] as [number, number];
    const b = ring[(i + 1) % 8] as [number, number];
    // outward: the ring runs anticlockwise seen from above, so the outside is on the edge's left
    const nx = a[1] - b[1];
    const nz = b[0] - a[0];
    const len = Math.hypot(nx, nz) || 1;
    const quad = [
      [a[0], y0, a[1]],
      [b[0], y0, b[1]],
      [b[0], y1, b[1]],
      [a[0], y0, a[1]],
      [b[0], y1, b[1]],
      [a[0], y1, a[1]],
    ];
    for (const v of quad) {
      pos.push(...(v as [number, number, number]));
      nor.push(nx / len, 0, nz / len);
    }
  }
  for (const [y, ny] of [
    [y1, 1],
    [y0, -1],
  ] as const) {
    for (let i = 1; i < 7; i++) {
      const a = ring[0] as [number, number];
      const b = ring[i] as [number, number];
      const cc = ring[i + 1] as [number, number];
      // wound so the lid faces up and the base faces down. It was the other way round: the bake
      // dropped every lid as a face turned away from the camera, and a bus with no roof of its own
      // was a hollow shell with its floor showing (owner, 16/09).
      const tri = ny > 0 ? [a, b, cc] : [a, cc, b];
      for (const v of tri) {
        pos.push(v[0], y, v[1]);
        nor.push(0, ny, 0);
      }
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new Float32BufferAttribute(nor, 3));
  return g;
}

export function cyl(rt: number, rb: number, h: number, c: ColorOrToken, seg = 8): Mesh {
  return mesh(
    cached(`cyl${k(rt, rb, h, seg)}`, () => new CylinderGeometry(rt, rb, h, seg)),
    c,
  );
}

export function cone(r: number, h: number, c: ColorOrToken, seg = 8): Mesh {
  return mesh(
    cached(`cone${k(r, h, seg)}`, () => new ConeGeometry(r, h, seg)),
    c,
  );
}

export function sphere(r: number, c: ColorOrToken, w = 8, h = 6): Mesh {
  return mesh(
    cached(`sph${k(r, w, h)}`, () => new SphereGeometry(r, w, h)),
    c,
  );
}

/** Half sphere, open side down (domes, observatories). */
export function dome(r: number, c: ColorOrToken, seg = 10): Mesh {
  return mesh(
    cached(
      `dome${k(r, seg)}`,
      () => new SphereGeometry(r, seg, Math.max(3, seg / 2), 0, Math.PI * 2, 0, Math.PI / 2),
    ),
    c,
  );
}

/** Faceted icosahedron (leaves, clouds, rocks). */
export function ico(r: number, c: number, kind: SurfaceKind = "solid", detail = 0): Mesh {
  return new Mesh(
    cached(`ico${k(r, detail)}`, () => new IcosahedronGeometry(r, detail)),
    tok(c, kind, true),
  );
}

/** Flat panel facing +z (windows, doors, signs). */
export function quad(w: number, h: number, c: ColorOrToken): Mesh {
  return mesh(
    cached(`quad${k(w, h)}`, () => new PlaneGeometry(w, h)),
    c,
  );
}

export function torus(r: number, tube: number, c: ColorOrToken, radial = 6, tubular = 12): Mesh {
  return mesh(
    cached(`tor${k(r, tube, radial, tubular)}`, () => new TorusGeometry(r, tube, radial, tubular)),
    c,
  );
}

export function extrude(shape: Shape, depth: number, c: ColorOrToken, cacheKey?: string): Mesh {
  const make = () => new ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 4 });
  return mesh(cacheKey ? cached(`ext${cacheKey}${k(depth)}`, make) : make(), c);
}

export function add<T extends Object3D>(parent: Object3D, obj: T, x = 0, y = 0, z = 0): T {
  obj.position.set(x, y, z);
  parent.add(obj);
  return obj;
}

export function group(): Object3D {
  return new Object3D();
}

/** Deterministic pseudo-random stream (same sequence on every device). */
export function rng(seed = 1): () => number {
  let s = Math.floor(Math.abs(seed) * 9301 + 49297) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function pick<T>(arr: readonly T[], i: number): T {
  const v = arr[((Math.floor(i) % arr.length) + arr.length) % arr.length];
  if (v === undefined) throw new Error("pick from empty array");
  return v;
}

/** Mark a point builders want the UI to know about (mission bubbles, order board, wonder tag). */
export function anchor(parent: Object3D, id: string, x: number, y: number, z: number): void {
  const a = new Object3D();
  a.name = `anchor:${id}`;
  a.userData.anchor = id;
  add(parent, a, x, y, z);
}
