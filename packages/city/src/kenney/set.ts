// The curated Kenney models the city uses (CC0, content/art/kenney/README.md). `pnpm --filter
// @mtct/city bake:kenney` turns exactly these into content/art/city/kenney.{bin,json}.

export const KENNEY_KITS = {
  commercial: "city-kit-commercial/Models/GLB format",
  suburban: "city-kit-suburban/Models/GLB format",
  industrial: "city-kit-industrial/Models/GLB format",
  roads: "city-kit-roads/Models/GLB format",
  nature: "nature-kit/Models/GLTF format",
} as const;
export type KenneyKit = keyof typeof KENNEY_KITS;

const commercial = [
  "building-a",
  "building-b",
  "building-c",
  "building-d",
  "building-f",
  "building-g",
  "building-h",
  "building-skyscraper-a",
  "building-skyscraper-b",
  "building-skyscraper-c",
  "building-skyscraper-d",
  "building-skyscraper-e",
  "low-detail-building-a",
  "low-detail-building-b",
  "low-detail-building-c",
  "low-detail-building-d",
  "low-detail-building-f",
  "low-detail-building-h",
  "low-detail-building-wide-a",
  "detail-parasol-a",
  "detail-awning-wide",
] as const;
const suburban = [
  "building-type-a",
  "building-type-b",
  "building-type-c",
  "building-type-e",
  "building-type-k",
  "building-type-o",
  "building-type-s",
  "fence-1x3",
  "planter",
  "tree-large",
  "tree-small",
] as const;
const industrial = [
  "chimney-large",
  "chimney-medium",
  "detail-tank",
  "shipping-container-a",
  "shipping-container-b",
  "shipping-container-c",
  "water-tower",
  "windmill",
  "solar-panel-landscape-group",
] as const;
const roads = [
  "road-straight",
  "road-crossroad",
  "road-intersection",
  "road-end",
  "road-square",
  "road-crossing",
  "bridge-pillar-wide",
  "light-curved",
  "traffic-light",
  "construction-cone",
  "construction-barrier",
] as const;
const nature = [
  "tree_default",
  "tree_oak",
  "tree_fat",
  "tree_simple",
  "tree_cone",
  "tree_plateau",
  "tree_blocks",
  "tree_palmTall",
  "tree_pineRoundA",
  "plant_bushLarge",
  "plant_bush",
  "flower_redA",
  "flower_yellowA",
  "flower_purpleA",
  "rock_largeA",
  "rock_smallC",
  "lily_large",
  "mushroom_red",
] as const;

export const KENNEY_SET = {
  commercial,
  suburban,
  industrial,
  roads,
  nature,
} as const;

export type KenneyKey =
  | `commercial/${(typeof commercial)[number]}`
  | `suburban/${(typeof suburban)[number]}`
  | `industrial/${(typeof industrial)[number]}`
  | `roads/${(typeof roads)[number]}`
  | `nature/${(typeof nature)[number]}`;

export function allKenneyKeys(): KenneyKey[] {
  return Object.entries(KENNEY_SET).flatMap(([kit, names]) =>
    (names as readonly string[]).map((n) => `${kit}/${n}` as KenneyKey),
  );
}

/** Manifest entry written by the bake script. Offsets are in vertices / indices. */
export interface KenneyModel {
  vOffset: number;
  vCount: number;
  iOffset: number;
  iCount: number;
  /** min x,y,z, max x,y,z in Kenney units (1 road tile = 1). */
  bbox: [number, number, number, number, number, number];
}

export interface KenneyManifest {
  version: 1;
  vertices: number;
  indices: number;
  /** Byte layout of kenney.bin: positions f32×3, normals i8×3, colors u8×3, indices u32. */
  layout: { positions: number; normals: number; colors: number; indices: number };
  models: Record<string, KenneyModel>;
}
