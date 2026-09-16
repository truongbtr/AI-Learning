import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Box3 } from "three";
import { describe, expect, it } from "vitest";
import { PLOT_CATALOGUE } from "./build/civic";
import { type Footprint, LOT_HALF, lotGarden, type StreetSides } from "./build/garden";
import { KenneyLibrary } from "./build/kenney";
import { SignAtlas } from "./build/signs";
import { skillBuilding } from "./build/skills";
import type { KenneyManifest } from "./kenney/set";
import { CITY, CITY_IDS } from "./palette";

const art = resolve(dirname(fileURLToPath(import.meta.url)), "../../../content/art/city");
const manifest = JSON.parse(readFileSync(join(art, "kenney.json"), "utf8")) as KenneyManifest;
const buf = readFileSync(join(art, "kenney.bin"));
const lib = new KenneyLibrary(
  manifest,
  buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
);

const SLOTS: StreetSides[] = [
  { x: -1, z: -1 },
  { x: 1, z: -1 },
  { x: -1, z: 1 },
  { x: 1, z: 1 },
];
/** Taller than paving and flower beds: something a walker would bump into. */
const TALL = 0.45;
const WALK_BAND = 0.62;

function footprintOf(box: Box3): Footprint {
  return { minX: box.min.x, maxX: box.max.x, minZ: box.min.z, maxZ: box.max.z };
}

/** Every house of every city at every level, and every plot build, with its footprint. */
function everyHouse() {
  const out: { name: string; ctx: ReturnType<typeof ctxFor>; f: Footprint }[] = [];
  for (const id of CITY_IDS) {
    const ctx = ctxFor(id);
    for (const level of [1, 2, 3, 4] as const)
      for (const seed of [1, 2, 3, 7, 11])
        out.push({
          name: `${id} L${level} #${seed}`,
          ctx,
          f: footprintOf(new Box3().setFromObject(skillBuilding(ctx, level, seed, "ab").root)),
        });
  }
  const ctx = ctxFor("vmath");
  for (const [code, entry] of Object.entries(PLOT_CATALOGUE))
    out.push({
      name: code,
      ctx,
      f: footprintOf(new Box3().setFromObject(entry.build(ctx, 1).root)),
    });
  return out;
}

function ctxFor(id: (typeof CITY_IDS)[number]) {
  return { city: CITY[id], lib, atlas: new SignAtlas() };
}

describe("the garden round every house (owner, 16/09)", () => {
  const houses = everyHouse();

  it("gives a house with room in front a yard and a path out to the edge of its lot", () => {
    let withYard = 0;
    for (const h of houses) {
      const { parts, root } = lotGarden(h.f, 3, SLOTS[3] as StreetSides);
      if (LOT_HALF - h.f.maxZ >= 0.35) {
        expect(parts, h.name).toContain("yard");
        withYard++;
      }
      if (LOT_HALF - h.f.maxZ > 0.05) {
        // a yard that already reaches the lane needs no path of its own
        expect(parts.includes("path") || parts.includes("yard"), h.name).toBe(true);
        // the paving reaches the front edge of the lot
        const box = new Box3().setFromObject(root);
        expect(box.max.z, h.name).toBeGreaterThan(LOT_HALF - 0.01);
      }
    }
    expect(withYard).toBeGreaterThan(houses.length / 2);
  });

  it("never plants anything in the house, outside the lot, or in the walkers' way", () => {
    for (const h of houses)
      for (const [slot, street] of SLOTS.entries())
        for (const seed of [1, 2, 3, 4, 5, 6]) {
          const { root } = lotGarden(h.f, seed, street);
          root.updateMatrixWorld(true);
          for (const child of root.children) {
            const box = new Box3().setFromObject(child);
            const where = `${h.name} slot ${slot} seed ${seed}`;
            // inside the lot
            expect(box.min.x, where).toBeGreaterThan(-LOT_HALF - 0.01);
            expect(box.max.x, where).toBeLessThan(LOT_HALF + 0.01);
            expect(box.min.z, where).toBeGreaterThan(-LOT_HALF - 0.01);
            expect(box.max.z, where).toBeLessThan(LOT_HALF + 0.01);
            if (box.max.y <= TALL) continue;
            // not inside the house
            const inside =
              box.min.x < h.f.maxX - 0.05 &&
              box.max.x > h.f.minX + 0.05 &&
              box.min.z < h.f.maxZ - 0.05 &&
              box.max.z > h.f.minZ + 0.05;
            expect(inside, where).toBe(false);
            // not in the walking strip along a street side (trees may lean their leaves over it)
            const trunkX = (box.min.x + box.max.x) / 2;
            const trunkZ = (box.min.z + box.max.z) / 2;
            expect(trunkX * street.x, where).toBeLessThan(LOT_HALF - WALK_BAND + 0.01);
            expect(trunkZ * street.z, where).toBeLessThan(LOT_HALF - WALK_BAND + 0.01);
          }
        }
  });

  it("plants all three kinds somewhere in town: hedges, bushes and flower beds", () => {
    const seen = new Set<string>();
    for (const h of houses)
      for (const seed of [1, 2, 3, 4, 5, 6])
        for (const part of lotGarden(h.f, seed, SLOTS[0] as StreetSides).parts) seen.add(part);
    for (const kind of ["hedge", "bushes", "flowers", "yard", "path"]) expect(seen).toContain(kind);
  });

  it("is the same garden every time for the same lot", () => {
    const h = houses[0];
    if (!h) return;
    const a = lotGarden(h.f, 9, SLOTS[1] as StreetSides);
    const b = lotGarden(h.f, 9, SLOTS[1] as StreetSides);
    expect(a.parts).toEqual(b.parts);
    const at = (g: typeof a) => g.root.children.map((c) => c.position.toArray());
    expect(at(a)).toEqual(at(b));
  });
});
