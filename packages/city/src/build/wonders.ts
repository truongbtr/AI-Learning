// Wonders built piece by piece — one piece per week with ≥ 4/7 learning days, never taken away.
// Missing pieces stay visible as pale glass with outlines, so the kid can see the whole shape coming.
// Hand-built from basic blocks: suggestive, not a replica (Pha 10 §2).

import { EdgesGeometry, LineBasicMaterial, LineSegments, Mesh, type Object3D } from "three";
import type { CityId } from "../palette";
import { WORLD } from "../palette";
import { crane, curvedRoof, scaffold, worker } from "./building";
import { add, anchor, box, cbox, cone, cyl, group, sphere, tok } from "./kit";

export const WONDER_PIECES: Record<CityId, number> = {
  vmath: 8,
  viet: 6,
  esl: 7,
  enl: 7,
  emath: 7,
  esci: 8,
};

type Piece = () => Object3D;
const lineMat = new LineBasicMaterial({ color: 0x4f9be0 });

function ghostify(obj: Object3D) {
  const meshes: Mesh[] = [];
  obj.traverse((o) => {
    if (o instanceof Mesh) meshes.push(o);
  });
  for (const m of meshes) {
    m.material = tok(0xcfeaff, "ghost");
    m.add(new LineSegments(new EdgesGeometry(m.geometry, 35), lineMat));
  }
}

interface WonderBuild {
  root: Object3D;
  top: number;
}

function assemble(
  pieces: Piece[],
  built: number,
  top: number,
  site: {
    scaffold: (b: number) => [number, number, number, number];
    crane: [number, number, number, number];
  },
): WonderBuild {
  const g = group();
  const done = Math.max(0, Math.min(built, pieces.length));
  pieces.forEach((make, i) => {
    const p = make();
    if (i >= done) ghostify(p);
    g.add(p);
  });
  if (done < pieces.length) {
    const [w, d, h, y] = site.scaffold(done);
    add(g, scaffold(w, d, h), 0, y, 0);
    const [cx, cz, ch, rot] = site.crane;
    const c = crane(ch, 5);
    c.rotation.y = rot;
    add(g, c, cx, 0, cz);
    add(g, worker(), w / 2 + 0.8, y, d / 2 + 0.6);
  }
  anchor(g, "wonder", 0, top + 1.5, 0);
  return { root: g, top };
}

export function wonder(city: CityId, built: number): WonderBuild {
  return BUILDERS[city](built);
}

const gold = () => tok(0xffe066, "light");

function pyramid(built: number): WonderBuild {
  const layers = 7;
  const base = 9;
  const step = 1.15;
  const lh = 0.95;
  const pieces: Piece[] = [];
  for (let i = 0; i < layers; i++) {
    pieces.push(() => {
      const s = base - i * step;
      const p = group();
      add(p, cbox(s, lh, s, i % 2 ? 0xffcf6e : 0xffd98a, 0.2), 0, i * lh + lh / 2, 0);
      add(p, box(s * 0.98, 0.06, 0.02, 0xe9b85a), 0, i * lh + lh * 0.5, s / 2 + 0.01);
      return p;
    });
  }
  pieces.push(() => {
    const p = group();
    const c = cone(1.2, 1.4, gold(), 4);
    c.rotation.y = Math.PI / 4;
    add(p, c, 0, layers * lh + 0.7, 0);
    return p;
  });
  const out = assemble(pieces, built, layers * lh + 1.4, {
    scaffold: (b) => {
      const i = Math.min(b, layers - 1);
      const s = base - i * step + 0.6;
      return [s, s, lh * 1.8, i * lh];
    },
    crane: [base / 2 + 1.5, -base / 2 + 0.6, 9, 2.4],
  });
  add(out.root, box(base + 3, 0.12, base + 3, WORLD.sand), 0, 0.02, 0);
  return out;
}

function onePillarPagoda(built: number): WonderBuild {
  const pieces: Piece[] = [
    () => {
      const p = group();
      add(p, box(8, 0.35, 8, 0xe8dcc4), 0, 0.17, 0);
      add(p, box(7.2, 0.1, 7.2, tok(WORLD.water, "water")), 0, 0.33, 0);
      for (const [x, z] of [
        [-2.4, 2.2],
        [2.5, -2.3],
        [-2.6, -1.8],
        [2.2, 2.6],
      ] as const) {
        add(p, cyl(0.5, 0.5, 0.04, 0x6fcf5a, 8), x, 0.4, z);
        add(p, sphere(0.18, 0xff9ec7, 5, 4), x + 0.1, 0.52, z);
      }
      return p;
    },
    () => {
      const p = group();
      add(p, cyl(0.42, 0.48, 3.0, 0xf2ead8, 10), 0, 1.8, 0);
      return p;
    },
    () => {
      const p = group();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const br = box(1.4, 0.12, 0.14, 0x9a4a2a);
        br.rotation.set(0, -a, 0.5);
        add(p, br, Math.cos(a) * 0.65, 3.0, Math.sin(a) * 0.65);
      }
      add(p, box(2.8, 0.18, 2.8, 0x9a4a2a), 0, 3.4, 0);
      return p;
    },
    () => {
      const p = group();
      add(p, cbox(2.2, 1.3, 2.2, 0xa8452c), 0, 4.15, 0);
      add(p, box(1.2, 0.9, 0.06, 0xffc93c), 0, 4.15, 1.12);
      add(p, box(0.06, 0.9, 1.2, 0xffc93c), 1.12, 4.15, 0);
      add(p, box(3.0, 0.14, 3.0, 0x7a3a22), 0, 3.55, 0);
      return p;
    },
    () => {
      const p = group();
      add(p, curvedRoof(2.6, 2.6, 1.0, 0x5c7a8a, 0.55, 0.45), 0, 4.8, 0);
      return p;
    },
    () => {
      const p = group();
      add(p, cyl(0.08, 0.14, 0.6, 0xffd447, 6), 0, 6.1, 0);
      add(p, sphere(0.25, gold(), 6, 5), 0, 6.5, 0);
      for (const s of [-1, 1]) {
        const dr = box(1.2, 0.14, 0.14, 0xffd447);
        dr.rotation.z = s * 0.25;
        add(p, dr, s * 0.55, 5.95, 0);
      }
      return p;
    },
  ];
  const out = assemble(pieces, built, 6.8, {
    scaffold: () => [3.4, 3.4, 3.2, 2.9],
    crane: [4.6, -3.8, 8, 2.4],
  });
  out.root.scale.setScalar(1.35);
  return { root: out.root, top: out.top * 1.35 };
}

function liberty(built: number): WonderBuild {
  const copper = 0x7fd3b4;
  const pieces: Piece[] = [
    () => {
      const p = group();
      add(p, cyl(4.6, 4.8, 0.5, 0xd9c9a8, 8), 0, 0.25, 0);
      add(p, cyl(3.0, 3.2, 0.9, 0xe8dcc4, 8), 0, 0.95, 0);
      return p;
    },
    () => {
      const p = group();
      add(p, cbox(2.6, 2.4, 2.6, 0xf2ead8, 0.3), 0, 2.6, 0);
      add(p, cbox(2.0, 0.9, 2.0, 0xe8dcc4, 0.2), 0, 4.25, 0);
      return p;
    },
    () => {
      const p = group();
      add(p, cyl(0.75, 1.1, 2.4, copper, 10), 0, 5.9, 0);
      return p;
    },
    () => {
      const p = group();
      add(p, cyl(0.55, 0.75, 1.6, copper, 10), 0, 7.9, 0);
      add(p, box(0.5, 0.7, 0.2, copper), -0.75, 7.4, 0.35);
      return p;
    },
    () => {
      const p = group();
      add(p, sphere(0.45, copper, 8, 6), 0, 9.1, 0);
      return p;
    },
    () => {
      const p = group();
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI - Math.PI / 2;
        const spike = cone(0.08, 0.5, copper, 4);
        spike.rotation.set(0, 0, -a * 0.9);
        add(p, spike, Math.sin(a) * 0.4, 9.55 + Math.cos(a) * 0.15, 0.1);
      }
      return p;
    },
    () => {
      const p = group();
      const arm = cyl(0.14, 0.18, 2.0, copper, 6);
      arm.rotation.z = -0.25;
      add(p, arm, 0.8, 9.3, 0);
      add(p, cyl(0.22, 0.12, 0.4, 0xffc93c, 6), 1.05, 10.4, 0);
      add(p, cone(0.24, 0.6, gold(), 6), 1.05, 10.9, 0);
      return p;
    },
  ];
  return assemble(pieces, built, 11.2, {
    scaffold: (b) => [3.0, 3.0, 3.0, Math.min(b, 5) * 1.5],
    crane: [4.8, -3.0, 10, 2.2],
  });
}

function parthenon(built: number): WonderBuild {
  const marble = 0xfbf3e2;
  const W = 9;
  const D = 5.6;
  const colH = 3.2;
  const colRow = (z: number, n: number) => () => {
    const p = group();
    for (let i = 0; i < n; i++)
      add(
        p,
        cyl(0.26, 0.3, colH, marble, 8),
        -W / 2 + 0.6 + (i * (W - 1.2)) / (n - 1),
        1.05 + colH / 2,
        z,
      );
    return p;
  };
  const pieces: Piece[] = [
    () => {
      const p = group();
      for (let s = 0; s < 3; s++)
        add(
          p,
          box(W + 1.6 - s * 0.5, 0.35, D + 1.6 - s * 0.5, s % 2 ? 0xf0e4c8 : 0xf6ecd6),
          0,
          0.18 + s * 0.35,
          0,
        );
      return p;
    },
    colRow(D / 2 - 0.3, 7),
    colRow(-D / 2 + 0.3, 7),
    () => {
      const p = group();
      for (const x of [-W / 2 + 0.6, W / 2 - 0.6])
        for (let i = 1; i < 4; i++)
          add(
            p,
            cyl(0.26, 0.3, colH, marble, 8),
            x,
            1.05 + colH / 2,
            -D / 2 + 0.3 + (i * (D - 0.6)) / 4,
          );
      add(p, cbox(W - 2.4, colH, D - 2.0, 0xf6ecd6, 0.2), 0, 1.05 + colH / 2, 0);
      return p;
    },
    () => {
      const p = group();
      add(p, box(W + 0.3, 0.6, D + 0.3, marble), 0, 1.05 + colH + 0.3, 0);
      return p;
    },
    () => {
      const p = group();
      const roof = cone(Math.hypot(W, D) / 2 + 0.3, 1.2, 0xe9dcc0, 4);
      roof.rotation.y = Math.PI / 4;
      roof.scale.set(1, 1, (D + 0.4) / (W + 0.4));
      add(p, roof, 0, 1.05 + colH + 1.2, 0);
      return p;
    },
    () => {
      const p = group();
      add(p, box(W + 0.34, 0.16, D + 0.34, 0xffd447), 0, 1.05 + colH + 0.62, 0);
      for (const x of [-W / 2, 0, W / 2])
        add(p, sphere(0.22, gold(), 5, 4), x, 1.05 + colH + 1.9, 0);
      return p;
    },
  ];
  return assemble(pieces, built, 6.4, {
    scaffold: (b) => [W + 0.6, D + 0.6, Math.max(1.2, Math.min(b, 5) * 0.9), 0.8],
    crane: [W / 2 + 2, -D / 2 - 1.2, 9, 2.4],
  });
}

function eiffel(built: number): WonderBuild {
  const iron = 0xc8905a;
  const leg = (x: number, z: number, y0: number, h: number, spread: number, t: number) => {
    const m = box(t, h, t, iron);
    m.rotation.set((-Math.sign(z) * spread) / h, 0, (Math.sign(x) * spread) / h);
    return [m, x, y0 + h / 2, z] as const;
  };
  const four = (half: number, y0: number, h: number, spread: number, t: number) => () => {
    const p = group();
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        const [m, x, y, z] = leg(sx * half, sz * half, y0, h, spread, t);
        add(p, m, x, y, z);
      }
    return p;
  };
  const platform = (y: number, s: number) => () => {
    const p = group();
    add(p, cbox(s, 0.35, s, iron, 0.2), 0, y, 0);
    add(p, box(s + 0.2, 0.12, s + 0.2, tok(0xffe8a0, "light")), 0, y + 0.24, 0);
    return p;
  };
  const pieces: Piece[] = [
    four(2.6, 0, 3.4, 1.0, 0.55),
    platform(3.5, 4.4),
    four(1.2, 3.7, 3.4, 0.5, 0.4),
    platform(7.2, 2.6),
    () => {
      const p = group();
      add(p, cyl(0.45, 0.9, 4.2, iron, 4), 0, 9.5, 0).rotation.y = Math.PI / 4;
      return p;
    },
    () => {
      const p = group();
      add(p, cbox(1.0, 0.7, 1.0, iron, 0.15), 0, 11.9, 0);
      add(p, box(1.1, 0.3, 1.1, tok(0xffe8a0, "light")), 0, 12.0, 0);
      return p;
    },
    () => {
      const p = group();
      add(p, cyl(0.06, 0.12, 1.8, iron, 4), 0, 13.2, 0);
      add(p, sphere(0.16, gold(), 5, 4), 0, 14.2, 0);
      return p;
    },
  ];
  // arches between the legs make it read as the tower from the city camera
  const out = assemble(pieces, built, 14.3, {
    scaffold: (b) => [
      Math.max(2, 4.4 - b * 0.5),
      Math.max(2, 4.4 - b * 0.5),
      2.8,
      Math.min(b, 5) * 1.8,
    ],
    crane: [4.6, -3.6, 11, 2.4],
  });
  if (built >= 2) {
    for (const r of [0, Math.PI / 2]) {
      const arch = cyl(1.6, 1.6, 0.3, iron, 10);
      arch.rotation.set(Math.PI / 2, 0, 0);
      arch.scale.set(1, 1, 0.5);
      const holder = group();
      add(holder, arch, 0, 2.6, 2.2);
      holder.rotation.y = r;
      out.root.add(holder);
    }
  }
  return out;
}

function greatWall(built: number): WonderBuild {
  const stone = 0xdccaa2;
  const path: [number, number, number][] = [
    [-7, 0, 3],
    [-4.5, 0.6, 1],
    [-2, 1.4, 2.4],
    [0.5, 2.2, 0.6],
    [3, 1.6, -1.2],
    [5.5, 0.8, 0.2],
    [8, 0.2, -1.8],
  ];
  const segment = (a: [number, number, number], b: [number, number, number]) => () => {
    const p = group();
    const dx = b[0] - a[0];
    const dz = b[2] - a[2];
    const len = Math.hypot(dx, dz);
    const holder = group();
    holder.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    holder.rotation.y = -Math.atan2(dz, dx);
    holder.rotation.z = Math.atan2(b[1] - a[1], len);
    add(holder, cbox(len + 0.2, 1.6, 1.4, stone, 0.1), 0, 0.8, 0);
    for (let i = 0; i < Math.floor(len / 0.6); i++) {
      for (const z of [-0.6, 0.6])
        add(holder, box(0.3, 0.35, 0.2, 0xe8d9b5), -len / 2 + 0.3 + i * 0.6, 1.75, z);
    }
    p.add(holder);
    return p;
  };
  const towerAt = (q: [number, number, number]) => () => {
    const p = group();
    add(p, cbox(2.0, 2.6 + q[1], 2.0, stone, 0.15), q[0], (2.6 + q[1]) / 2, q[2]);
    add(p, cone(1.5, 0.9, 0xb5552f, 4), q[0], 2.6 + q[1] + 0.45, q[2]).rotation.y = Math.PI / 4;
    add(p, box(0.5, 0.6, 0.05, tok(0xfff3a0, "light")), q[0], 1.6 + q[1], q[2] + 1.01);
    return p;
  };
  const hills = () => {
    const p = group();
    for (const [x, h, z] of [
      [-2, 1.4, 1.6],
      [0.5, 2.2, 0],
      [3, 1.6, -1],
    ] as const) {
      const m = sphere(3.2, tok(0x6fd244, "solid", true), 7, 4);
      m.scale.set(1, h / 3.2, 0.8);
      add(p, m, x, 0, z);
    }
    return p;
  };
  const P = (i: number) => path[i] as [number, number, number];
  const pieces: Piece[] = [
    () => {
      const p = hills();
      for (const c of [...segment(P(0), P(1))().children]) p.add(c);
      return p;
    },
    towerAt(P(1)),
    segment(P(1), P(2)),
    segment(P(2), P(3)),
    towerAt(P(3)),
    segment(P(3), P(4)),
    segment(P(4), P(5)),
    () => {
      const p = towerAt(P(5))();
      for (const c of [...segment(P(5), P(6))().children]) p.add(c);
      return p;
    },
  ];
  return assemble(pieces, built, 6, {
    scaffold: (b) => {
      const q = P(Math.min(6, b));
      return [2.2, 2.2, 2.4, q[1]];
    },
    crane: [-6, -4, 8, 1.4],
  });
}

const BUILDERS: Record<CityId, (built: number) => WonderBuild> = {
  vmath: pyramid,
  viet: onePillarPagoda,
  esl: liberty,
  enl: parthenon,
  emath: eiffel,
  esci: greatWall,
};
