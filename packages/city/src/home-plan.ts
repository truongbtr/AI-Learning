// The town the children actually live in, as a plan the engine can build.
//
// Chủ dự án, 16/09/2026: "Có 1 thành phố giống y hệt thế này, các con đang ở đây — vẽ giống từng
// con đường, dòng sông, ngôi nhà, tên lấy theo đúng tên trên bản đồ." That reverses the rule the
// phase started with (borrow the geometry, invent the names), so it is written down here and in
// ADR-23: ONE city is the children's home town by name, the other five stay invented.
//
// How it was made: by eye, from the map and the satellite photographs in
// docs/screens/pha-12/tham-khao/ — the canal across the north, Đường 379 cutting the whole town
// from north-west to south-east, the fish-bone canals of The Island in the west, Hồ Thiên Nga long
// and thin in the middle, the golf course east of the road, Aqua Bay in the south. It is a sketch
// at the scale of a toy: the shapes, the order and the names are the real ones, the metres are not.
// Nothing from those images is copied into the game; this is geometry typed out by hand.
//
// The repo is the family's own. If it is ever opened up, this file and the reference folder go
// first (docs/screens/pha-12/tham-khao/README.md).

export interface PlanRoad {
  id: string;
  name?: string;
  points: [number, number][];
  width: number;
  kind: "avenue" | "belt" | "spoke";
}

export interface PlanDistrict {
  /** The name as it is on the real map. */
  name: string;
  /** The line the district runs along: where its sign stands and how its streets are drawn. */
  spine: [number, number][];
  /** Its streets, houses down both sides of each. Usually `parallel(spine, [...])`. */
  streets: [number, number][][];
  /** Houses on both sides of a street, or only on one (water or a park on the other). */
  sides: "both" | "left" | "right";
  /** Terraces, villas or towers — it changes what gets built there. */
  style: "terrace" | "villa" | "tower";
  /** Where the sign stands, if not on the spine's middle. */
  sign?: [number, number];
}

/**
 * Streets drawn alongside a line, one per offset. Positive offsets step to the right of the way the
 * line runs (south, for a line running east); this is how a row of terraces is written down without
 * typing out every corner of every street.
 */
export function parallel(line: [number, number][], offsets: number[]): [number, number][][] {
  return offsets.map((offset) =>
    line.map((point, i) => {
      const a = line[Math.max(0, i - 1)] as [number, number];
      const b = line[Math.min(line.length - 1, i + 1)] as [number, number];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      return [
        point[0] - ((b[1] - a[1]) / len) * offset,
        point[1] + ((b[0] - a[0]) / len) * offset,
      ] as [number, number];
    }),
  );
}

export interface CityPlan {
  /** The name shown to the child. */
  name: string;
  /** Half the width of the plan, in world units. */
  extent: number;
  river: { name: string; points: [number, number][]; width: number };
  /** The canal fingers of the island districts, and the bay. */
  canals: { points: [number, number][]; width: number }[];
  lakes: {
    name?: string;
    at: [number, number];
    radius: number;
    wobble?: number;
    /** How much longer than wide, and which way the long axis points. */
    long?: number;
    angle?: number;
  }[];
  /** The golf course and the other big green areas. */
  greens: { name?: string; at: [number, number]; radius: number }[];
  roads: PlanRoad[];
  districts: PlanDistrict[];
  /** Where the town hall and the wonder go. */
  townHall: { at: [number, number]; facing: number };
  wonder: [number, number];
  /** The harbour on the river. */
  harbour: { at: [number, number]; angle: number };
  bridge: { at: [number, number]; angle: number; span: number };
}

/** The line each district runs along; its streets are drawn alongside these. */
const SPINE = {
  parkRiver: [
    [-204, -150],
    [-174, -144],
    [-144, -142],
    [-116, -146],
    [-88, -152],
  ],
  island: [
    [-38, -59],
    [-73, -32],
    [-108, -5],
  ],
  cbd: [
    [-214, -82],
    [-202, -44],
    [-194, -6],
    [-190, 30],
  ],
  education: [
    [-60, -92],
    [-20, -88],
    [20, -90],
    [62, -96],
    [96, -104],
  ],
  doiHoa: [
    [-136, -4],
    [-124, 32],
    [-112, 68],
    [-100, 102],
  ],
  dragon: [
    [-186, 40],
    [-168, 70],
    [-148, 98],
  ],
  aquaBay: [
    [-44, 110],
    [-8, 118],
    [32, 132],
    [74, 128],
    [112, 112],
  ],
  palmSprings: [
    [96, 96],
    [130, 74],
    [164, 50],
    [196, 24],
  ],
} satisfies Record<string, [number, number][]>;

/**
 * Ecopark, Văn Giang — the plan, at play scale. North is −z, east is +x.
 *
 * The bones: sông Bắc Hưng Hải along the north; Đường 379 running the length of the town from the
 * bridge in the north-west down to Văn Giang in the south-east; Park River on the south bank; The
 * Island's canal fingers in the west with a row of houses on every strip between them; the tall
 * clusters on the western edge; Đồi Hoa and Hồ Thiên Nga in the middle; the golf course filling the
 * east of the road; Aqua Bay and the golf academy in the south.
 */
export const ECOPARK: CityPlan = {
  name: "Ecopark",
  extent: 230,
  river: {
    name: "Sông Bắc Hưng Hải",
    width: 24,
    points: [
      [-230, -176],
      [-160, -170],
      [-104, -152],
      [-52, -130],
      [6, -122],
      [70, -118],
      [134, -124],
      [190, -134],
      [230, -146],
    ],
  },
  canals: [
    // The Island: four fingers of water off the river, a strip of houses on each side of every one
    {
      width: 9,
      points: [
        [-96, -148],
        [-99, -138],
        [-160, -92],
      ],
    },
    {
      width: 9,
      points: [
        [-68, -99],
        [-138, -45],
      ],
    },
    {
      width: 9,
      points: [
        [-7, -20],
        [-77, 34],
      ],
    },
    {
      width: 9,
      points: [
        [23, 20],
        [-47, 74],
        [-52, 62],
      ],
    },
    // Aqua Bay: the water the southern district is built around
    {
      width: 14,
      points: [
        [24, 158],
        [62, 138],
        [100, 120],
        [140, 116],
      ],
    },
  ],
  lakes: [
    // long and thin, lying along the road like the real one
    { name: "Hồ Thiên Nga", at: [-46, 44], radius: 22, wobble: 5, long: 2.3, angle: 0.9 },
    { name: "Hồ Sen", at: [108, 43], radius: 16, wobble: 3 },
    { at: [112, -42], radius: 20, wobble: 5, long: 1.6, angle: 0.6 },
    { at: [173, -64], radius: 14, wobble: 3 },
    { at: [-64, 146], radius: 12, wobble: 3 },
  ],
  greens: [
    { name: "Sân Golf 18 lỗ", at: [44, -30], radius: 46 },
    { at: [56, 26], radius: 22 },
    { name: "Đồi Hoa", at: [-78, -8], radius: 16 },
    { name: "Học viện Golf EPGA", at: [15, 135], radius: 22 },
    { at: [184, 124], radius: 24 },
  ],
  roads: [
    {
      id: "dt379",
      name: "Đường 379",
      width: 9,
      kind: "avenue",
      points: [
        [-66, -230],
        [-62, -171],
        [-56, -122],
        [-38, -78],
        [-20, -42],
        [9, 11],
        [44, 55],
        [80, 93],
        [108, 116],
        [141, 155],
        [165, 200],
      ],
    },
    {
      id: "vanh-dai",
      name: "Đường vành đai",
      width: 6.6,
      kind: "belt",
      points: [
        [-120, -116],
        [-186, -60],
        [-210, 10],
        [-186, 86],
        [-116, 140],
        [-30, 166],
        [60, 150],
        [120, 120],
        [170, 60],
        [186, -10],
        [160, -80],
        [90, -112],
        [10, -120],
        [-60, -124],
        [-120, -116],
      ],
    },
    {
      id: "trung-tam",
      name: "Trục trung tâm",
      width: 6.6,
      kind: "belt",
      points: [
        [-96, -24],
        [-84, 16],
        [-72, 60],
        [-52, 96],
        [-20, 120],
      ],
    },
    {
      id: "ven-ho",
      name: "Đường ven hồ",
      width: 6,
      kind: "belt",
      // right round Hồ Thiên Nga, the long way the lake lies
      points: [
        [-1, 100],
        [-36, 101],
        [-76, 68],
        [-99, 21],
        [-91, -12],
        [-57, -13],
        [-16, 20],
        [7, 67],
        [-1, 100],
      ],
    },
  ],
  districts: [
    {
      name: "Park River",
      style: "terrace",
      sides: "both",
      spine: SPINE.parkRiver,
      streets: parallel(SPINE.parkRiver, [0, 34]),
      sign: [-158, -108],
    },
    {
      // the fish bone: one street down the middle of every strip between two canals
      name: "The Island",
      style: "terrace",
      sides: "both",
      spine: SPINE.island,
      streets: parallel(SPINE.island, [-25, 25, 75]),
      sign: [-96, -44],
    },
    {
      name: "Ecopark CBD",
      style: "tower",
      sides: "both",
      spine: SPINE.cbd,
      streets: parallel(SPINE.cbd, [-18, 18]),
    },
    {
      name: "Education HUB",
      style: "terrace",
      sides: "both",
      spine: SPINE.education,
      streets: parallel(SPINE.education, [0]),
    },
    {
      name: "Khu Đồi Hoa",
      style: "villa",
      sides: "both",
      spine: SPINE.doiHoa,
      streets: parallel(SPINE.doiHoa, [-18, 18]),
    },
    {
      name: "Dragon Islands",
      style: "villa",
      sides: "both",
      spine: SPINE.dragon,
      streets: parallel(SPINE.dragon, [-18, 18]),
    },
    {
      name: "Aqua Bay",
      style: "terrace",
      sides: "both",
      spine: SPINE.aquaBay,
      streets: parallel(SPINE.aquaBay, [-34, 0, 34]),
    },
    {
      name: "Palm Springs",
      style: "villa",
      sides: "both",
      spine: SPINE.palmSprings,
      streets: parallel(SPINE.palmSprings, [-36, 0, 36]),
    },
  ],
  townHall: { at: [-24, 72], facing: 0.6 },
  wonder: [96, -6],
  harbour: { at: [-10, -110], angle: 0.15 },
  bridge: { at: [-57, -127], angle: 0.14, span: 40 },
};

/** Which subject city is the children's home town; the other five are invented (ADR-23). */
export const HOME_CITY = "viet";
