import type { BufferAttribute } from "three";
import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { bake } from "./build/bake";
import { cbox } from "./build/kit";
import { bus } from "./build/props";

/** Every triangle of a geometry, with the normal its winding gives and the normal it stores. */
function triangles(position: BufferAttribute, normal: BufferAttribute, index?: BufferAttribute) {
  const count = index ? index.count : position.count;
  const at = (i: number) => (index ? index.getX(i) : i);
  const out: { centre: Vector3; wound: Vector3; stored: Vector3 }[] = [];
  for (let i = 0; i < count; i += 3) {
    const [a, b, c] = [at(i), at(i + 1), at(i + 2)].map((v) =>
      new Vector3().fromBufferAttribute(position, v),
    ) as [Vector3, Vector3, Vector3];
    const wound = new Vector3().subVectors(b, a).cross(new Vector3().subVectors(c, a)).normalize();
    const stored = new Vector3().fromBufferAttribute(normal, at(i)).normalize();
    out.push({ centre: a.clone().add(b).add(c).divideScalar(3), wound, stored });
  }
  return out;
}

describe("the chamfered box every building and vehicle is made of", () => {
  it("faces outward on every side, lid and base, and says so in its normals", () => {
    const geometry = cbox(3.4, 1.15, 1.2, 0xffc93c, 0.2).geometry;
    const tris = triangles(
      geometry.getAttribute("position") as BufferAttribute,
      geometry.getAttribute("normal") as BufferAttribute,
    );
    expect(tris.length).toBe(8 * 2 + 6 * 2);
    for (const t of tris) {
      // the centre of the box is the origin: an outward face points away from it
      expect(t.wound.dot(t.centre)).toBeGreaterThan(0);
      expect(t.stored.dot(t.wound)).toBeGreaterThan(0.99);
    }
    // and it has a lid facing the sky and a base facing the ground
    expect(tris.filter((t) => t.wound.y > 0.99)).toHaveLength(6);
    expect(tris.filter((t) => t.wound.y < -0.99)).toHaveLength(6);
  });

  it("gives the bus a roof once it is baked into a moving model", () => {
    const geometry = bake(bus(0xffc93c), 1e6, { single: true }).meshes[0]?.geometry;
    expect(geometry).toBeDefined();
    const tris = triangles(
      geometry?.getAttribute("position") as BufferAttribute,
      geometry?.getAttribute("normal") as BufferAttribute,
      geometry?.index ?? undefined,
    );
    const top = Math.max(...tris.map((t) => t.centre.y));
    // the highest faces of the bus are its roof, and they look up
    const roof = tris.filter((t) => t.centre.y > top - 0.01);
    expect(roof.length).toBeGreaterThan(0);
    for (const t of roof) expect(t.wound.y).toBeGreaterThan(0.99);
  });
});
