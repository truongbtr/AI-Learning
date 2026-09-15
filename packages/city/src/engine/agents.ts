// Moving things: templates for InstancedMesh (one draw call per archetype) and their limits.
import type { BufferGeometry, Object3D } from "three";
import { bake } from "../build/bake";
import { boat, bunny, bus, car, cat, dog, duck, person } from "../build/props";
import type { AgentLoad } from "./budget";

export const AGENT_MAX = { car: 16, bus: 3, person: 30, boat: 4, pet: 6 } as const;

export type AgentKey =
  | "car"
  | "bus"
  | "personA"
  | "personB"
  | "personC"
  | "boat"
  | "dog"
  | "cat"
  | "bunny"
  | "duck";

function template(obj: Object3D): BufferGeometry {
  const g = bake(obj, 1e6, { single: true }).meshes[0]?.geometry;
  if (!g) throw new Error("empty agent template");
  return g;
}

export function buildAgentTemplates(): Record<AgentKey, BufferGeometry> {
  return {
    car: template(car(0xffffff)),
    bus: template(bus(0xffc93c)),
    personA: template(person(0xff6f61)),
    personB: template(person(0x5e93d6)),
    personC: template(person(0xffd447, { h: 0.7 })),
    boat: template(boat(0xff7a4d)),
    dog: template(dog()),
    cat: template(cat()),
    bunny: template(bunny()),
    duck: template(duck()),
  };
}

/** Worst case for the budget: every archetype drawn, every instance at its maximum. */
export function maxAgentLoad(templates: Record<AgentKey, BufferGeometry>): AgentLoad {
  const tris = (k: AgentKey) => (templates[k].index?.count ?? 0) / 3;
  const triangles =
    tris("car") * AGENT_MAX.car +
    tris("bus") * AGENT_MAX.bus +
    ((tris("personA") + tris("personB") + tris("personC")) / 3) * AGENT_MAX.person +
    tris("boat") * AGENT_MAX.boat +
    Math.max(tris("dog"), tris("cat"), tris("bunny"), tris("duck")) * AGENT_MAX.pet;
  return { drawCalls: Object.keys(templates).length, triangles };
}
