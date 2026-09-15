// Pha 10 — style-board scene library. Seed of packages/city (việc 2): everything here is plain
// three.js so it can move over unchanged. Kenney kits (CC0) give street furniture, decor houses,
// skyscrapers, trees; skill buildings and wonders are parametric so they can grow with mastery.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export const TILE = 3.2;

// ---------------------------------------------------------------- palettes
// Brighter than 3d-proto (~+15% saturation), sunny sky, lime-green grass.
export const WORLD = {
  grass: 0x79dc48,
  grassDark: 0x62cc3c,
  lawn: 0x96e85a,
  path: 0xfff0c9,
  plaza: 0xfbeed2,
  water: 0x3fc3f2,
  waterShallow: 0x8fe6f8,
  sand: 0xffe39a,
  skyTop: 0x3fa9f5,
  skyHorizon: 0xd2f3ff,
  hill: [0x6fd244, 0x5cc53f, 0x86e052],
  mountain: 0x9ad7c4,
  road: 0x8f99ad,
  curb: 0xfff6e4,
  leaves: [0x4fc93a, 0x6ad943, 0x8ee64f, 0x3fb83a],
  blossom: [0xff9ec7, 0xffc2dd],
  trunk: 0xa8703f,
};
export const CITY = {
  vmath: {
    name: "Thành Số",
    a: 0x5e93d6,
    b: 0xffd447,
    walls: [0xffd447, 0x8fc0ff, 0xffffff, 0xffa95e, 0xa8ecff, 0xc6f07a],
    roofs: [0x3f7de0, 0xffbf1f, 0xff7a4d, 0x22b8a5],
    trim: 0xfff6dd,
    glass: 0x7fdcff,
    blocks: [0xff6f61, 0xffd447, 0x5ec96b, 0x5e93d6, 0xb283e0, 0xff9f43],
  },
  viet: {
    name: "Phố Chữ",
    a: 0xe76f51,
    b: 0x6fae5a,
    walls: [0xffd98a, 0xfff1d6, 0xffc9a3, 0xc9eeaa, 0xffe6a8],
    roofs: [0xe76f51, 0xd9573d, 0xf28a5b],
    trim: 0xfff6e2,
    glass: 0x9fe2f2,
    blocks: [0xe76f51, 0x6fae5a, 0xffc93c, 0x5fb8e8, 0xff8fb1],
  },
  esl: {
    name: "Bến Cảng Từ",
    a: 0x2a9d8f,
    b: 0xf4a261,
    walls: [0xffffff, 0x7fd8cc, 0xffc48a],
    roofs: [0x2a9d8f, 0xf4a261, 0x2f6f8f],
    trim: 0xffffff,
    glass: 0x8ee8ff,
    blocks: [0x2a9d8f, 0xf4a261, 0xffd447],
  },
  enl: {
    name: "Vườn Sách",
    a: 0x8e7cc3,
    b: 0x9bd07e,
    walls: [0xe6dcff, 0xfff8ff, 0xd2c4f7],
    roofs: [0x8e7cc3, 0x6f5bb0, 0x9bd07e],
    trim: 0xffffff,
    glass: 0xb5ebff,
    blocks: [0x8e7cc3, 0x9bd07e, 0xffd447],
  },
  emath: {
    name: "Xưởng Máy",
    a: 0xe9954a,
    b: 0x8896a6,
    walls: [0xffb070, 0xd4dce6, 0xa0aebe],
    roofs: [0x5d6b7d, 0xe9954a],
    trim: 0xf3f6fa,
    glass: 0x8fdcff,
    blocks: [0xe9954a, 0x8896a6, 0xffd447],
  },
  esci: {
    name: "Trạm Khám Phá",
    a: 0x47b8c4,
    b: 0xb283e0,
    walls: [0xc8f4fa, 0xffffff, 0xd6b8f2],
    roofs: [0x2fb0be, 0x9a6ae0],
    trim: 0xffffff,
    glass: 0xc6f6ff,
    blocks: [0x47b8c4, 0xb283e0, 0xffd447],
  },
};

// ---------------------------------------------------------------- world curvature
// The city stays flat; beyond r0 the ground bends away (tiny-planet look) so a ~25° city-builder
// camera still shows sky and clouds above the hills. Patched into the shared vertex chunk so shadow
// depth passes bend identically. Materials with defines.NO_CURVE (clouds, sky) are left straight.
export function enableCurvature({ center = [0, 0], r0 = 65, k = 0.004 } = {}) {
  const f = (v) => v.toFixed(5);
  THREE.ShaderChunk.project_vertex = THREE.ShaderChunk.project_vertex.replace(
    "mvPosition = modelViewMatrix * mvPosition;",
    `#ifndef NO_CURVE
  vec4 curveWp = modelMatrix * mvPosition;
  float curveD = max(0.0, length(curveWp.xz - vec2(${f(center[0])}, ${f(center[1])})) - ${f(r0)});
  curveWp.y -= ${f(k)} * curveD * curveD;
  mvPosition = viewMatrix * curveWp;
#else
  mvPosition = modelViewMatrix * mvPosition;
#endif`,
  );
}

// ---------------------------------------------------------------- stage
export function createStage({
  W,
  H,
  fov = 24,
  target = [0, 0, 0],
  dist = 170,
  yaw = 45,
  pitch = 34,
  background = null,
  shadowSpan = 70,
}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H);
  renderer.shadowMap.enabled = !new URLSearchParams(location.search).has("noshadow");
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  if (background !== null) scene.background = new THREE.Color(background);
  else {
    scene.background = new THREE.Color(WORLD.skyHorizon);
    scene.add(skyDome());
    scene.fog = new THREE.Fog(WORLD.skyHorizon, dist * 1.25, dist * 3.2);
  }
  const camera = new THREE.PerspectiveCamera(fov, W / H, 1, 2000);
  const y = THREE.MathUtils.degToRad(yaw),
    p = THREE.MathUtils.degToRad(pitch);
  camera.position.set(
    target[0] + Math.sin(y) * Math.cos(p) * dist,
    target[1] + Math.sin(p) * dist,
    target[2] + Math.cos(y) * Math.cos(p) * dist,
  );
  camera.lookAt(...target);

  scene.add(new THREE.HemisphereLight(0xeef8ff, 0xf6ead0, 1.3));
  const sun = new THREE.DirectionalLight(0xfff1d8, 2.0);
  sun.position.set(target[0] - 26, 56, target[2] + 54);
  sun.target.position.set(...target);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, {
    left: -shadowSpan,
    right: shadowSpan,
    top: shadowSpan,
    bottom: -shadowSpan,
    near: 1,
    far: 260,
  });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xe4f2ff, 0.8);
  fill.position.set(target[0] + 60, 28, target[2] + 4);
  scene.add(fill);
  return { renderer, scene, camera, sun };
}

function skyDome() {
  const geo = new THREE.SphereGeometry(900, 32, 16);
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      top: { value: new THREE.Color(WORLD.skyTop) },
      bottom: { value: new THREE.Color(WORLD.skyHorizon) },
    },
    vertexShader:
      "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader:
      "uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float t = clamp(vP.y*2.6+0.02,0.0,1.0); gl_FragColor = linearToOutputTexel(vec4(mix(bottom, top, pow(t,0.8)),1.0)); }",
  });
  return new THREE.Mesh(geo, m);
}

// ---------------------------------------------------------------- primitives
const matCache = new Map();
export function mat(c, o = {}) {
  const key = c + JSON.stringify(o);
  if (!o.noCache && matCache.has(key)) return matCache.get(key);
  const { noCache, ...rest } = o;
  const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, metalness: 0, ...rest });
  if (!noCache) matCache.set(key, m);
  return m;
}
export const glassMat = (tint = 0x7fdcff) =>
  mat(tint, { roughness: 0.15, metalness: 0.3, emissive: 0x2a7fb0, emissiveIntensity: 0.3 });
const geoCache = new Map();
function rbox(w, h, d, r) {
  const k = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}|${r}`;
  if (!geoCache.has(k))
    geoCache.set(
      k,
      new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)),
    );
  return geoCache.get(k);
}
export function box(w, h, d, m, r = 0.06) {
  const mesh = new THREE.Mesh(rbox(w, h, d, r), m);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
export function cyl(rt, rb, h, m, seg = 14) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
export function sphere(r, m, w = 16, h = 12) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, w, h), m);
  mesh.castShadow = true;
  return mesh;
}
export function cone(r, h, m, seg = 12) {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), m);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
export function add(parent, obj, x = 0, y = 0, z = 0) {
  obj.position.set(x, y, z);
  parent.add(obj);
  return obj;
}
export function rng(seed = 1) {
  let k = seed;
  return () => {
    k = (k * 9301 + 49297) % 233280;
    return k / 233280;
  };
}

// canvas text → texture (Vietnamese diacritics render with the system UI font)
const texCache = new Map();
export function textTexture(
  text,
  {
    bg = null,
    fg = "#1f2d4a",
    size = 256,
    w = 256,
    h = 256,
    font = "900",
    radius = 40,
    stroke = null,
  } = {},
) {
  const key = [text, bg, fg, size, w, h, font, stroke].join("|");
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  if (bg) {
    g.fillStyle = bg;
    g.beginPath();
    g.roundRect(0, 0, w, h, radius);
    g.fill();
  }
  g.font = `${font} ${size}px "Segoe UI", "Nunito", Arial, sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  if (stroke) {
    g.lineWidth = size * 0.12;
    g.strokeStyle = stroke;
    g.strokeText(text, w / 2, h / 2 + size * 0.04);
  }
  g.fillStyle = fg;
  g.fillText(text, w / 2, h / 2 + size * 0.04);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  texCache.set(key, t);
  return t;
}
export function decal(tex, w, h, { emissive = 0.15 } = {}) {
  const m = new THREE.MeshStandardMaterial({
    map: tex,
    transparent: true,
    roughness: 0.6,
    emissive: 0xffffff,
    emissiveMap: tex,
    emissiveIntensity: emissive,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  return mesh;
}

// ---------------------------------------------------------------- Kenney
const loader = new GLTFLoader();
const KDIR = {
  commercial: "../kenney/city-kit-commercial/Models/GLB format",
  suburban: "../kenney/city-kit-suburban/Models/GLB format",
  industrial: "../kenney/city-kit-industrial/Models/GLB format",
  roads: "../kenney/city-kit-roads/Models/GLB format",
  nature: "../kenney/nature-kit/Models/GLTF format",
};
const gltfCache = new Map();
export async function preload(list) {
  await Promise.all(
    list.map(async ([kit, name]) => {
      const k = `${kit}/${name}`;
      if (!gltfCache.has(k))
        gltfCache.set(k, (await loader.loadAsync(`${KDIR[kit]}/${name}.glb`)).scene);
    }),
  );
}

// Colormap recolor: Kenney city kits sample flat swatches from one 512² atlas. We repaint the
// swatches per city — near-white walls → wall colour, dark greys → roof colour, blues → bright glass,
// greens → the city's accent — keeping each swatch's shading gradient.
const hsl = { h: 0, s: 0, l: 0 };
const rgbOut = { r: 0, g: 0, b: 0 };
const recolorCache = new Map();
function recolorMap(srcTex, spec, key) {
  if (recolorCache.has(key)) return recolorCache.get(key);
  const img = srcTex.image;
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext("2d");
  g.drawImage(img, 0, 0);
  const data = g.getImageData(0, 0, c.width, c.height);
  const px = data.data;
  const col = new THREE.Color();
  const tgt = new THREE.Color();
  const th = { h: 0, s: 0, l: 0 };
  for (let i = 0; i < px.length; i += 4) {
    col.setRGB(px[i] / 255, px[i + 1] / 255, px[i + 2] / 255, THREE.SRGBColorSpace);
    col.getHSL(hsl, THREE.SRGBColorSpace);
    let out = null;
    const deg = hsl.h * 360;
    if (spec.road) {
      if (hsl.l > 0.7) out = [spec.curb, hsl.l / 0.85];
      else if (hsl.l > 0.3) out = [spec.road, hsl.l / 0.45];
      else out = [spec.road, 0.7];
    } else if (hsl.s < 0.3 || (deg > 215 && deg < 260 && hsl.l > 0.78)) {
      if (hsl.l > 0.74) out = [spec.wall, Math.min(1.08, hsl.l / 0.93)];
      else if (hsl.l > 0.4) out = [spec.trim, hsl.l / 0.6];
      else out = [spec.roof, 0.75 + hsl.l];
    } else if (deg > 195 && deg < 255) out = [spec.glass, hsl.l / 0.62];
    else if (deg > 110 && deg < 175) out = [spec.accent, hsl.l / 0.55];
    if (out) {
      tgt.set(out[0]);
      tgt.getHSL(th, THREE.SRGBColorSpace);
      col.setHSL(
        th.h,
        Math.min(1, th.s * 1.05),
        THREE.MathUtils.clamp(th.l * out[1], 0.04, 0.97),
        THREE.SRGBColorSpace,
      );
    } else {
      col.setHSL(hsl.h, Math.min(1, hsl.s * 1.18), hsl.l, THREE.SRGBColorSpace);
    }
    col.getRGB(rgbOut, THREE.SRGBColorSpace);
    px[i] = rgbOut.r * 255;
    px[i + 1] = rgbOut.g * 255;
    px[i + 2] = rgbOut.b * 255;
  }
  g.putImageData(data, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.flipY = srcTex.flipY;
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = srcTex.magFilter;
  t.minFilter = srcTex.minFilter;
  t.wrapS = srcTex.wrapS;
  t.wrapT = srcTex.wrapT;
  recolorCache.set(key, t);
  return t;
}

const natureColor = new Map();
function natureRecolor(m, leaves) {
  const c = m.color;
  c.getHSL(hsl, THREE.SRGBColorSpace);
  const deg = hsl.h * 360;
  const k = m.name + "|" + leaves;
  if (natureColor.has(k)) return natureColor.get(k);
  const nm = m.clone();
  if (deg > 90 && deg < 190 && hsl.s > 0.15) {
    const pick = hsl.l < 0.28 ? leaves[0] : hsl.l < 0.4 ? leaves[1] : leaves[2];
    nm.color.set(pick);
  } else if (deg < 45 && hsl.s > 0.15 && hsl.l < 0.5) nm.color.set(WORLD.trunk);
  else
    nm.color.setHSL(
      hsl.h,
      Math.min(1, hsl.s * 1.3),
      Math.min(0.9, hsl.l * 1.15),
      THREE.SRGBColorSpace,
    );
  nm.flatShading = true;
  nm.roughness = 0.9;
  nm.metalness = 0;
  natureColor.set(k, nm);
  return nm;
}

export function kenney(
  kit,
  name,
  { scale = TILE, rot = 0, spec = null, specKey = "", leaves = null } = {},
) {
  const src = gltfCache.get(`${kit}/${name}`);
  if (!src) throw new Error(`not preloaded: ${kit}/${name}`);
  const obj = src.clone(true);
  obj.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    if (kit === "nature") {
      o.material = natureRecolor(
        o.material,
        leaves || [WORLD.leaves[3], WORLD.leaves[0], WORLD.leaves[2]],
      );
      return;
    }
    if (spec && o.material.map) {
      const key = `${kit}|${specKey}|${o.material.map.uuid}`;
      if (!recolorCache.has(key + "#m")) {
        const nm = o.material.clone();
        nm.map = recolorMap(o.material.map, spec, key);
        nm.roughness = 0.75;
        nm.metalness = 0;
        recolorCache.set(key + "#m", nm);
      }
      o.material = recolorCache.get(key + "#m");
    }
  });
  obj.scale.setScalar(scale);
  obj.rotation.y = rot;
  return obj;
}

// ---------------------------------------------------------------- roofs
// Vietnamese hip roof (mái ngói cong): four concave slopes, eave corners curl upward, tile grooves.
let tileTex = null;
function roofTiles() {
  if (tileTex) return tileTex;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d");
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 64, 64);
  for (let x = 0; x < 64; x += 16) {
    const gr = g.createLinearGradient(x, 0, x + 16, 0);
    gr.addColorStop(0, "#d9d9d9");
    gr.addColorStop(0.45, "#ffffff");
    gr.addColorStop(1, "#bdbdbd");
    g.fillStyle = gr;
    g.fillRect(x, 0, 16, 64);
  }
  g.fillStyle = "rgba(0,0,0,0.13)";
  for (let y = 0; y < 64; y += 16) g.fillRect(0, y, 64, 2);
  tileTex = new THREE.CanvasTexture(c);
  tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping;
  tileTex.colorSpace = THREE.SRGBColorSpace;
  tileTex.anisotropy = 8;
  return tileTex;
}
export function curvedRoof(w, d, h, color, flare = 0.35, overhang = 0.35) {
  const W = w + 2 * overhang,
    D = d + 2 * overhang;
  const alongX = W >= D;
  const R = Math.abs(W - D);
  const ridgeA = alongX ? [-R / 2, 0] : [0, -R / 2],
    ridgeB = alongX ? [R / 2, 0] : [0, R / 2];
  const c = [
    [-W / 2, D / 2],
    [W / 2, D / 2],
    [W / 2, -D / 2],
    [-W / 2, -D / 2],
  ];
  // each face: base corner pair and the ridge points above them
  const top = (p) => (alongX ? [(Math.sign(p[0]) * R) / 2, 0] : [0, (Math.sign(p[1]) * R) / 2]);
  const faces = [
    [c[0], c[1]],
    [c[1], c[2]],
    [c[2], c[3]],
    [c[3], c[0]],
  ];
  const g = new THREE.Group();
  const m = mat(color, { roughness: 0.7, map: roofTiles() });
  const nu = 14,
    nv = 7;
  for (const [A, B] of faces) {
    const TA = top(A),
      TB = top(B);
    const pos = [],
      uv = [],
      idx = [];
    const edgeLen = Math.hypot(B[0] - A[0], B[1] - A[1]);
    for (let j = 0; j <= nv; j++) {
      const v = j / nv;
      const yv = h * v ** 1.7;
      for (let i = 0; i <= nu; i++) {
        const u = i / nu;
        const uu = u * 2 - 1;
        const bx = A[0] + (B[0] - A[0]) * u,
          bz = A[1] + (B[1] - A[1]) * u;
        const tx = TA[0] + (TB[0] - TA[0]) * u,
          tz = TA[1] + (TB[1] - TA[1]) * u;
        const x = bx + (tx - bx) * v,
          z = bz + (tz - bz) * v;
        const curl = flare * Math.abs(uu) ** 5 * (1 - v) ** 2.2;
        pos.push(x, yv + curl, z);
        uv.push((u * edgeLen) / 0.32, (v * h) / 0.28);
      }
    }
    for (let j = 0; j < nv; j++)
      for (let i = 0; i < nu; i++) {
        const a = j * (nu + 1) + i,
          b = a + 1,
          cc = a + nu + 1,
          dd = cc + 1;
        idx.push(a, b, cc, b, dd, cc);
      }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const n = new THREE.Vector3().fromBufferAttribute(geo.attributes.normal, Math.floor(nu / 2));
    const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    if (n.x * mid[0] + n.z * mid[1] < 0) {
      const ix = geo.index.array;
      for (let k = 0; k < ix.length; k += 3) {
        const t = ix[k + 1];
        ix[k + 1] = ix[k + 2];
        ix[k + 2] = t;
      }
      geo.computeVertexNormals();
    }
    const mesh = new THREE.Mesh(geo, m);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
    // underside so the eaves never look hollow from low angles
    const under = new THREE.Mesh(geo, mat(0x8a4a30, { side: THREE.BackSide }));
    g.add(under);
  }
  const beam = mat(0xfff0d0);
  add(g, box(Math.max(R, 0.1) + 0.3, 0.16, 0.2, beam, 0.06), 0, h + 0.03, 0).rotation.y = alongX
    ? 0
    : Math.PI / 2;
  for (const p of [ridgeA, ridgeB]) {
    const curl = cone(0.12, 0.45, beam, 6);
    curl.rotation.z = (alongX ? -Math.sign(p[0] || 1) : 0) * 0.9;
    curl.rotation.x = (alongX ? 0 : Math.sign(p[1] || 1)) * 0.9;
    add(g, curl, p[0], h + 0.22, p[1]);
  }
  return g;
}

// ---------------------------------------------------------------- generic building (from 3d-proto, extended)
export function building(o) {
  const g = new THREE.Group();
  const {
    w = 3,
    d = 3,
    floors = 2,
    fh = 1.15,
    wall,
    trim = 0xfff4d8,
    roof,
    roofType = "flat",
    glass = 0x7fdcff,
    band = true,
  } = o;
  const H = floors * fh;
  const plinthH = o.plinth ?? 0.18;
  add(g, box(w + 0.35, plinthH, d + 0.35, mat(0xf0e8d4), 0.05), 0, plinthH / 2, 0);
  add(g, box(w, H, d, mat(wall), 0.08), 0, plinthH + H / 2, 0);
  const gm = glassMat(glass),
    tm = mat(trim);
  for (let f = 0; f < floors; f++) {
    const y0 = plinthH + f * fh;
    if (band && f > 0) add(g, box(w + 0.12, 0.1, d + 0.12, tm, 0.03), 0, y0, 0);
    if (o.shopFloor && f === 0) continue;
    const nx = Math.max(1, Math.round(w / 1.05)),
      nz = Math.max(1, Math.round(d / 1.05));
    for (let i = 0; i < nx; i++) {
      const x = -w / 2 + (i + 0.5) * (w / nx);
      add(g, box(0.62, 0.66, 0.08, gm, 0.02), x, y0 + fh * 0.55, d / 2 + 0.03);
      add(g, box(0.74, 0.78, 0.05, tm, 0.02), x, y0 + fh * 0.55, d / 2 + 0.005);
      add(g, box(0.62, 0.66, 0.08, gm, 0.02), x, y0 + fh * 0.55, -d / 2 - 0.03);
    }
    for (let i = 0; i < nz; i++) {
      const z = -d / 2 + (i + 0.5) * (d / nz);
      add(g, box(0.08, 0.66, 0.62, gm, 0.02), w / 2 + 0.03, y0 + fh * 0.55, z);
      add(g, box(0.05, 0.78, 0.74, tm, 0.02), w / 2 + 0.005, y0 + fh * 0.55, z);
      add(g, box(0.08, 0.66, 0.62, gm, 0.02), -w / 2 - 0.03, y0 + fh * 0.55, z);
    }
  }
  if (!o.noDoor)
    add(
      g,
      box(0.7, 0.95, 0.1, mat(o.door ?? 0x9a623e), 0.03),
      w / 2 - 0.8,
      plinthH + 0.48,
      d / 2 + 0.04,
    );
  if (o.awning)
    add(g, box(1.1, 0.08, 0.6, mat(o.awning), 0.03), w / 2 - 0.8, plinthH + 1.05, d / 2 + 0.3);
  const top = plinthH + H;
  g.userData.top = top;
  if (roofType === "flat") {
    add(g, box(w + 0.2, 0.16, d + 0.2, tm, 0.04), 0, top + 0.08, 0);
    add(g, box(w - 0.5, 0.08, d - 0.5, mat(roof), 0.03), 0, top + 0.2, 0);
    if (o.ac)
      add(g, box(0.5, 0.35, 0.5, mat(0xe2e2e2), 0.04), -w / 2 + 0.6, top + 0.38, -d / 2 + 0.6);
  } else if (roofType === "hip") {
    const hh = Math.min(w, d) * 0.42;
    const m = cone(Math.max(w, d) * 0.78, hh, mat(roof, { roughness: 0.7 }), 4);
    m.rotation.y = Math.PI / 4;
    m.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
    add(g, m, 0, top + hh / 2 - 0.02, 0);
    add(g, box(w + 0.25, 0.1, d + 0.25, tm, 0.03), 0, top + 0.03, 0);
    g.userData.top = top + hh;
  } else if (roofType === "curved") {
    const hh = Math.min(w, d) * 0.42;
    add(g, curvedRoof(w, d, hh, roof, o.flare ?? 0.4), 0, top - 0.02, 0);
    g.userData.top = top + hh;
  } else if (roofType === "gable") {
    const hh = d * 0.38;
    const shape = new THREE.Shape();
    shape.moveTo(-d / 2 - 0.25, 0);
    shape.lineTo(d / 2 + 0.25, 0);
    shape.lineTo(0, hh);
    shape.closePath();
    const m = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, { depth: w + 0.4, bevelEnabled: false }),
      mat(roof, { roughness: 0.7 }),
    );
    m.rotation.y = Math.PI / 2;
    m.castShadow = true;
    m.receiveShadow = true;
    add(g, m, -(w + 0.4) / 2, top - 0.02, 0);
    g.userData.top = top + hh;
  }
  if (o.dome)
    add(
      g,
      sphere(Math.min(w, d) * 0.36, mat(o.dome, { roughness: 0.5 }), 24, 12),
      0,
      top + 0.2,
      0,
    ).scale.y = 0.9;
  if (o.sign) add(g, box(w * 0.6, 0.42, 0.1, mat(o.sign), 0.04), 0, top - 0.35, d / 2 + 0.06);
  if (o.signText) {
    const s = decal(
      textTexture(o.signText, {
        bg: o.signBg ?? "#ffffff",
        fg: o.signFg ?? "#1f2d4a",
        size: 110,
        w: 512,
        h: 160,
        radius: 50,
      }),
      Math.min(w * 0.85, 3.2),
      (Math.min(w * 0.85, 3.2) * 160) / 512,
    );
    add(g, s, 0, top - 0.42, d / 2 + 0.13);
  }
  if (o.storefront) {
    add(
      g,
      box(w - 0.3, fh * 0.78, 0.1, glassMat(0xa6eeff), 0.03),
      0,
      plinthH + fh * 0.5,
      d / 2 + 0.05,
    );
    const n = Math.max(2, Math.round(w / 1.1));
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + (i + 0.5) * (w / n);
      const a = box(w / n - 0.08, 0.07, 0.7, mat(i % 2 ? 0xffffff : o.storefront), 0.02);
      a.rotation.x = 0.28;
      add(g, a, x, plinthH + fh * 0.98, d / 2 + 0.36);
    }
  }
  if (o.columns) {
    const n = Math.max(2, Math.round(w / 1.2));
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + (i + 0.5) * (w / n);
      add(g, cyl(0.16, 0.18, H, mat(0xfffaf0), 12), x, plinthH + H / 2, d / 2 + 0.55);
    }
    add(g, box(w + 0.4, 0.22, 1.2, mat(0xfffaf0), 0.04), 0, plinthH + H + 0.05, d / 2 + 0.3);
  }
  if (o.chimney)
    add(g, box(0.42, 1.1, 0.42, mat(0xd98b66), 0.04), w / 2 - 0.6, top + 0.55, -d / 2 + 0.7);
  if (o.tank) {
    add(g, cyl(0.42, 0.42, 0.7, mat(0xe2dccf)), w / 2 - 0.7, top + 0.75, d / 2 - 0.7);
  }
  if (o.garden) {
    add(g, box(w - 0.9, 0.16, d - 0.9, mat(WORLD.lawn), 0.05), 0, top + 0.3, 0);
    for (const [dx, dz] of [
      [-0.5, -0.4],
      [0.6, 0.3],
      [0.1, -0.7],
    ]) {
      const b = bush(WORLD.leaves[1]);
      b.scale.setScalar(0.6);
      add(g, b, dx, top + 0.42, dz);
    }
  }
  if (o.clock) {
    add(g, box(1.3, o.clock, 1.3, mat(0xfffaf0), 0.06), 0, top + o.clock / 2, 0);
    const face = cyl(0.44, 0.44, 0.08, mat(0xffffff), 24);
    face.rotation.x = Math.PI / 2;
    add(g, face, 0, top + o.clock - 0.6, 0.68);
    add(g, box(0.07, 0.32, 0.03, mat(0x1f3a5f), 0.01), 0, top + o.clock - 0.48, 0.74);
    add(g, box(0.24, 0.07, 0.03, mat(0x1f3a5f), 0.01), 0.1, top + o.clock - 0.6, 0.74);
    const cap = cone(1.05, 0.9, mat(roof), 4);
    cap.rotation.y = Math.PI / 4;
    add(g, cap, 0, top + o.clock + 0.42, 0);
    add(
      g,
      sphere(0.15, mat(0xffd447, { emissive: 0xa07800, emissiveIntensity: 0.5 })),
      0,
      top + o.clock + 0.95,
      0,
    );
    g.userData.top = top + o.clock + 1.1;
  }
  return g;
}

// ---------------------------------------------------------------- nature & props
export function tree(size = 1, c = WORLD.leaves[0], seed = 1) {
  const g = new THREE.Group();
  const r = rng(seed);
  add(g, cyl(0.09 * size, 0.13 * size, 0.7 * size, mat(WORLD.trunk), 7), 0, 0.35 * size, 0);
  const geo = new THREE.IcosahedronGeometry(0.55 * size, 0);
  for (const [x, y, z, sc] of [
    [0, 1.05, 0, 1],
    [0.35, 0.8, 0.15, 0.72],
    [-0.3, 0.85, -0.2, 0.68],
  ]) {
    const m = new THREE.Mesh(geo, mat(c, { roughness: 0.9, flatShading: true }));
    m.scale.setScalar(sc);
    m.rotation.set(r() * 3, r() * 3, 0);
    m.castShadow = true;
    m.receiveShadow = true;
    add(g, m, x * size, y * size, z * size);
  }
  return g;
}
export function bush(c = WORLD.leaves[1]) {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 0), mat(c, { flatShading: true }));
  m.castShadow = true;
  m.position.y = 0.3;
  return m;
}
export function flowerBed(w, d, seed = 3) {
  const g = new THREE.Group();
  const r = rng(seed);
  add(g, box(w, 0.22, d, mat(0xc98f5e), 0.05), 0, 0.11, 0);
  add(g, box(w - 0.12, 0.06, d - 0.12, mat(0x7a5236), 0.02), 0, 0.23, 0);
  const cols = [0xff6fa5, 0xffd447, 0xffffff, 0xb283e0, 0xff8f4a];
  for (let i = 0; i < Math.floor(w * d * 7); i++)
    add(
      g,
      sphere(0.09, mat(cols[i % cols.length]), 6, 5),
      (r() - 0.5) * (w - 0.2),
      0.32,
      (r() - 0.5) * (d - 0.2),
    );
  return g;
}
export function cloud(scale = 1, seed = 1) {
  const g = new THREE.Group();
  const r = rng(seed);
  const m = mat(0xffffff, {
    roughness: 1,
    flatShading: true,
    emissive: 0xffffff,
    emissiveIntensity: 0.45,
  });
  m.defines = { NO_CURVE: "" };
  const n = 5 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), m);
    const sc = (1.1 + r() * 1.3) * scale;
    s.scale.set(sc * 1.2, sc * 0.8, sc);
    add(g, s, (i - n / 2) * 1.6 * scale, r() * 0.8 * scale, (r() - 0.5) * 1.6 * scale);
  }
  return g;
}
export function hill(r, h, c, seed = 1) {
  const geo = new THREE.IcosahedronGeometry(1, 2);
  const pos = geo.attributes.position;
  const rr = rng(seed);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    pos.setY(i, y < 0 ? 0 : y);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat(c, { flatShading: true, roughness: 1 }));
  m.scale.set(r, h, r * (0.8 + rr() * 0.4));
  m.receiveShadow = true;
  m.castShadow = true;
  return m;
}
export function lampPost() {
  const g = new THREE.Group();
  add(g, cyl(0.05, 0.07, 2.2, mat(0x46607a), 8), 0, 1.1, 0);
  add(g, box(0.5, 0.16, 0.26, mat(0x46607a), 0.04), 0.18, 2.25, 0);
  add(
    g,
    box(0.36, 0.08, 0.2, mat(0xfff1b8, { emissive: 0xffe08a, emissiveIntensity: 0.8 }), 0.02),
    0.18,
    2.16,
    0,
  );
  return g;
}
export function bench(rot = 0) {
  const g = new THREE.Group();
  add(g, box(1.2, 0.08, 0.4, mat(0xc98f5e), 0.02), 0, 0.42, 0);
  add(g, box(1.2, 0.34, 0.08, mat(0xc98f5e), 0.02), 0, 0.62, -0.18);
  for (const dx of [-0.45, 0.45]) add(g, box(0.08, 0.4, 0.36, mat(0x46607a), 0.02), dx, 0.2, 0);
  g.rotation.y = rot;
  return g;
}
export function wheel(r = 0.26, w = 0.2) {
  const wh = cyl(r, r, w, mat(0x2b2b3a), 14);
  wh.rotation.x = Math.PI / 2;
  return wh;
}
export function bus(color = 0xffc93c) {
  const g = new THREE.Group();
  add(g, box(3.4, 1.15, 1.2, mat(color, { roughness: 0.45 }), 0.14), 0, 0.85, 0);
  const gm = glassMat(0xaee8ff);
  for (let i = 0; i < 4; i++) {
    add(g, box(0.62, 0.5, 0.06, gm, 0.03), -1.2 + i * 0.8, 1.05, 0.62);
    add(g, box(0.62, 0.5, 0.06, gm, 0.03), -1.2 + i * 0.8, 1.05, -0.62);
  }
  add(g, box(0.08, 0.5, 1.0, gm, 0.03), 1.72, 1.05, 0);
  add(g, box(3.3, 0.12, 1.24, mat(0xffffff), 0.04), 0, 0.5, 0);
  for (const [dx, dz] of [
    [-1.1, 0.6],
    [1.1, 0.6],
    [-1.1, -0.6],
    [1.1, -0.6],
  ])
    add(g, wheel(), dx, 0.28, dz);
  return g;
}
export function car(color = 0xff6f61) {
  const g = new THREE.Group();
  add(g, box(1.6, 0.5, 0.8, mat(color, { roughness: 0.4 }), 0.12), 0, 0.45, 0);
  add(g, box(0.9, 0.42, 0.72, glassMat(0xaee8ff), 0.12), -0.1, 0.88, 0);
  add(g, box(0.92, 0.08, 0.74, mat(color, { roughness: 0.4 }), 0.04), -0.1, 1.1, 0);
  for (const [x, z] of [
    [-0.5, 0.42],
    [0.5, 0.42],
    [-0.5, -0.42],
    [0.5, -0.42],
  ])
    add(g, wheel(0.2, 0.16), x, 0.2, z);
  return g;
}
export function boat(color = 0xff7a4d) {
  const g = new THREE.Group();
  const hull = box(2.6, 0.5, 1.1, mat(0xffffff), 0.2);
  add(g, hull, 0, 0.1, 0);
  add(g, box(2.7, 0.14, 1.16, mat(color), 0.06), 0, 0.3, 0);
  add(g, box(1.0, 0.6, 0.8, mat(0xfff6e4), 0.1), -0.2, 0.7, 0);
  add(g, box(0.9, 0.2, 0.84, glassMat(), 0.05), -0.2, 0.82, 0);
  add(g, cyl(0.04, 0.04, 1.4, mat(0x9a623e), 6), 0.6, 1.0, 0);
  const fl = box(0.5, 0.3, 0.03, mat(0xffd447), 0.01);
  add(g, fl, 0.86, 1.55, 0);
  return g;
}
export function person(
  shirt = 0xff6f61,
  { skin = 0xffd1a8, hair = 0x3b2a20, hat = null, vest = null, h = 0.95 } = {},
) {
  const g = new THREE.Group();
  const s = h / 0.95;
  add(g, box(0.1 * s, 0.34 * s, 0.12 * s, mat(0x3a4a6a), 0.04), -0.07 * s, 0.17 * s, 0);
  add(g, box(0.1 * s, 0.34 * s, 0.12 * s, mat(0x3a4a6a), 0.04), 0.07 * s, 0.17 * s, 0);
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.15 * s, 0.24 * s, 4, 10),
    mat(vest ?? shirt),
  );
  body.castShadow = true;
  add(g, body, 0, 0.52 * s, 0);
  add(g, sphere(0.16 * s, mat(skin), 14, 10), 0, 0.86 * s, 0);
  if (hat) {
    const hh = sphere(0.18 * s, mat(hat, { roughness: 0.4 }), 14, 8);
    hh.scale.y = 0.6;
    add(g, hh, 0, 0.94 * s, 0);
    add(g, cyl(0.24 * s, 0.24 * s, 0.03 * s, mat(hat), 14), 0, 0.9 * s, 0.03);
  } else {
    const hr = sphere(0.165 * s, mat(hair), 14, 8);
    hr.scale.set(1, 0.7, 1);
    add(g, hr, 0, 0.92 * s, -0.02);
  }
  return g;
}
export function worker() {
  const g = person(0xffffff, { hat: 0xffc21a, vest: 0xff8a2a });
  const arm = box(0.07, 0.34, 0.08, mat(0xff8a2a), 0.03);
  arm.rotation.z = -2.4;
  add(g, arm, 0.22, 0.86, 0);
  return g;
}
export function dog(color = 0xf2c28a) {
  const g = new THREE.Group();
  add(g, box(0.5, 0.24, 0.24, mat(color), 0.1), 0, 0.3, 0);
  add(g, box(0.24, 0.22, 0.22, mat(color), 0.09), 0.3, 0.46, 0);
  add(g, box(0.1, 0.1, 0.14, mat(0x3b2a20), 0.04), 0.44, 0.44, 0);
  for (const [x, z] of [
    [-0.18, 0.08],
    [0.18, 0.08],
    [-0.18, -0.08],
    [0.18, -0.08],
  ])
    add(g, box(0.07, 0.2, 0.07, mat(color), 0.03), x, 0.1, z);
  const tail = box(0.05, 0.2, 0.05, mat(color), 0.02);
  tail.rotation.z = 0.7;
  add(g, tail, -0.3, 0.45, 0);
  add(g, box(0.06, 0.12, 0.1, mat(0x9a623e), 0.02), 0.28, 0.6, 0.1);
  add(g, box(0.06, 0.12, 0.1, mat(0x9a623e), 0.02), 0.28, 0.6, -0.1);
  return g;
}
export function balloon(c1 = 0xff6f61, c2 = 0xffd447) {
  const g = new THREE.Group();
  const env = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 10), [
    mat(c1, { flatShading: true }),
  ]);
  env.castShadow = true;
  const geo = new THREE.SphereGeometry(1.2, 12, 10);
  const cols = [];
  const idx = geo.index;
  geo.clearGroups();
  const faces = idx.count / 3;
  for (let f = 0; f < faces; f++) {
    const v = idx.getX(f * 3);
    const x = geo.attributes.position.getX(v),
      z = geo.attributes.position.getZ(v);
    const seg = Math.floor(((Math.atan2(z, x) + Math.PI) / (Math.PI * 2)) * 12);
    geo.addGroup(f * 3, 3, seg % 2);
  }
  void cols;
  const e2 = new THREE.Mesh(geo, [mat(c1, { flatShading: true }), mat(c2, { flatShading: true })]);
  e2.castShadow = true;
  e2.scale.set(1, 1.15, 1);
  add(g, e2, 0, 1.9, 0);
  const nk = cone(0.5, 0.7, mat(c1), 12);
  nk.rotation.x = Math.PI;
  add(g, nk, 0, 0.62, 0);
  add(g, box(0.6, 0.4, 0.6, mat(0xc98f5e), 0.06), 0, -0.2, 0);
  return g;
}
export function iceCreamCart() {
  const g = new THREE.Group();
  add(g, box(1.2, 0.7, 0.7, mat(0xffffff), 0.1), 0, 0.6, 0);
  add(g, box(1.24, 0.14, 0.74, mat(0xff8fb1), 0.05), 0, 0.3, 0);
  add(g, wheel(0.2, 0.1), -0.35, 0.2, 0.38);
  add(g, wheel(0.2, 0.1), 0.35, 0.2, 0.38);
  add(g, cyl(0.03, 0.03, 1.0, mat(0xffffff), 6), 0, 1.3, 0);
  const um = cone(0.85, 0.35, mat(0xff8fb1), 10);
  add(g, um, 0, 1.9, 0);
  add(g, cone(0.12, 0.3, mat(0xf3c27a), 8), 0.3, 1.1, 0).rotation.x = Math.PI;
  add(g, sphere(0.13, mat(0xa8ecff), 10, 8), 0.3, 1.3, 0);
  return g;
}
export function fountain(r = 1.5) {
  const g = new THREE.Group();
  add(g, cyl(r, r, 0.32, mat(0xf2e4c2), 28), 0, 0.16, 0);
  add(
    g,
    cyl(r - 0.2, r - 0.2, 0.08, mat(WORLD.water, { roughness: 0.15, metalness: 0.1 }), 28),
    0,
    0.3,
    0,
  );
  add(g, cyl(0.25, 0.35, 0.9, mat(0xf2e4c2), 12), 0, 0.6, 0);
  add(g, cyl(0.7, 0.5, 0.16, mat(0xf2e4c2), 18), 0, 1.05, 0);
  const j = cone(
    0.3,
    1.0,
    mat(0xc8f2ff, { transparent: true, opacity: 0.85, emissive: 0x9ae6ff, emissiveIntensity: 0.3 }),
    10,
  );
  add(g, j, 0, 1.6, 0);
  return g;
}
export function statue(c = 0xffd447) {
  const g = new THREE.Group();
  add(g, box(0.9, 0.8, 0.9, mat(0xf2e4c2), 0.05), 0, 0.4, 0);
  const p = person(c, { skin: c, hair: c, h: 1.3 });
  p.traverse((o) => {
    if (o.isMesh) o.material = mat(c, { roughness: 0.35, metalness: 0.3 });
  });
  add(g, p, 0, 0.8, 0);
  return g;
}
export function flag(color = 0xffd447, h = 2.6) {
  const g = new THREE.Group();
  add(g, cyl(0.04, 0.05, h, mat(0xe8ecf2), 8), 0, h / 2, 0);
  add(g, box(0.9, 0.55, 0.04, mat(color), 0.02), 0.47, h - 0.35, 0);
  return g;
}
export function lantern(c = 0xff5a3c, s = 1) {
  const g = new THREE.Group();
  const gold = mat(0xffc93c, { metalness: 0.2, roughness: 0.4 });
  add(g, cyl(0.004, 0.004, 0.2 * s, mat(0x5a4636), 3), 0, 0.5 * s, 0);
  add(g, cyl(0.09 * s, 0.09 * s, 0.05 * s, gold, 10), 0, 0.4 * s, 0);
  const body = sphere(
    0.19 * s,
    mat(c, { emissive: c, emissiveIntensity: 0.45, roughness: 0.5 }),
    14,
    10,
  );
  body.scale.y = 1.05;
  add(g, body, 0, 0.22 * s, 0);
  add(g, cyl(0.09 * s, 0.09 * s, 0.05 * s, gold, 10), 0, 0.03 * s, 0);
  add(g, cyl(0.02 * s, 0.035 * s, 0.14 * s, gold, 6), 0, -0.07 * s, 0);
  return g;
}
export function lanternString(len, n = 6, h = 2.1, colors = [0xff5a3c, 0xff7a2e]) {
  const g = new THREE.Group();
  add(g, cyl(0.015, 0.015, len, mat(0x5a4636), 4), 0, h, 0).rotation.z = Math.PI / 2;
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + ((i + 0.5) * len) / n;
    const sag = -0.25 * Math.sin(((i + 0.5) / n) * Math.PI);
    add(g, lantern(colors[i % colors.length]), x, h - 0.5 + sag, 0);
  }
  return g;
}

// ---------------------------------------------------------------- construction & missions
export function scaffold(w, d, h) {
  const g = new THREE.Group();
  const wood = mat(0xd49a5a);
  const levels = Math.max(2, Math.round(h / 1.2));
  for (const [x, z] of [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [-w / 2, d / 2],
    [w / 2, d / 2],
    [0, d / 2],
    [0, -d / 2],
  ])
    add(g, cyl(0.06, 0.06, h, wood, 6), x, h / 2, z);
  for (let l = 1; l <= levels; l++) {
    const y = (l / levels) * h - 0.05;
    add(g, box(w + 0.1, 0.08, 0.08, wood, 0.02), 0, y, d / 2);
    add(g, box(w + 0.1, 0.08, 0.08, wood, 0.02), 0, y, -d / 2);
    add(g, box(0.08, 0.08, d + 0.1, wood, 0.02), w / 2, y, 0);
    add(g, box(0.08, 0.08, d + 0.1, wood, 0.02), -w / 2, y, 0);
    add(g, box(w + 0.2, 0.05, 0.42, mat(0xf2d29b), 0.02), 0, y + 0.07, d / 2 + 0.2);
  }
  const brace = box(Math.hypot(w / 2, h / levels), 0.06, 0.06, wood, 0.02);
  brace.rotation.z = Math.atan2(h / levels, w / 2);
  add(g, brace, -w / 4, h / levels / 2, d / 2 + 0.02);
  return g;
}
export function crane(h = 6, arm = 4, color = 0xffc21a) {
  const g = new THREE.Group();
  const m = mat(color, { roughness: 0.5 });
  add(g, box(0.7, 0.3, 0.7, mat(0x8a96a8), 0.05), 0, 0.15, 0);
  for (let i = 0; i < Math.floor(h / 0.6); i++) {
    add(g, box(0.36, 0.08, 0.36, m, 0.01), 0, 0.5 + i * 0.6, 0);
  }
  for (const [x, z] of [
    [-0.16, -0.16],
    [0.16, -0.16],
    [-0.16, 0.16],
    [0.16, 0.16],
  ])
    add(g, box(0.06, h, 0.06, m, 0.02), x, h / 2 + 0.3, z);
  add(g, box(arm + 1.2, 0.22, 0.3, m, 0.04), arm / 2 - 0.6, h + 0.4, 0);
  add(g, box(0.7, 0.5, 0.5, mat(0x8a96a8), 0.05), -1.0, h + 0.2, 0);
  add(g, box(0.5, 0.45, 0.5, glassMat(), 0.08), 0.2, h + 0.05, 0.35);
  add(g, cyl(0.015, 0.015, 1.8, mat(0x333333), 4), arm - 0.3, h - 0.5, 0);
  g.userData.hook = new THREE.Vector3(arm - 0.3, h - 1.5, 0);
  return g;
}
export function missionBubble(icon = "★", { color = "#ffb400", scale = 1 } = {}) {
  const g = new THREE.Group();
  const halo = new THREE.Mesh(
    new THREE.CircleGeometry(1.25, 32),
    new THREE.MeshBasicMaterial({
      color: 0xfff3b0,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    }),
  );
  const face = decal(
    textTexture(icon, {
      bg: "#ffffff",
      fg: color,
      size: 190,
      w: 256,
      h: 256,
      radius: 120,
      stroke: "#fff2b3",
    }),
    1.7,
    1.7,
    { emissive: 0.6 },
  );
  add(g, halo, 0, 0, -0.02);
  add(g, face, 0, 0, 0);
  const tail = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 0.5, 3),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  );
  tail.rotation.z = Math.PI;
  add(g, tail, 0, -0.95, -0.01);
  g.scale.setScalar(scale);
  g.userData.billboard = true;
  return g;
}
export function sparkles(n = 6, r = 1.3, seed = 2) {
  const g = new THREE.Group();
  const rr = rng(seed);
  for (let i = 0; i < n; i++) {
    const s = decal(
      textTexture("✦", { fg: "#fff6a0", size: 220, stroke: "#ffcf33" }),
      0.5 + rr() * 0.35,
      0.5 + rr() * 0.35,
      { emissive: 1 },
    );
    const a = rr() * Math.PI * 2;
    add(g, s, Math.cos(a) * r, (rr() - 0.3) * r, 0.05);
  }
  g.userData.billboard = true;
  return g;
}
export function orderBoard() {
  // đơn của Toà Thị Chính
  const g = new THREE.Group();
  for (const x of [-0.7, 0.7]) add(g, cyl(0.06, 0.06, 1.8, mat(0x9a623e), 6), x, 0.9, 0);
  add(g, box(1.8, 1.2, 0.12, mat(0xc98f5e), 0.05), 0, 1.35, 0);
  const paper = decal(
    textTexture("📜", { bg: "#fffaf0", size: 120, w: 256, h: 180, radius: 20 }),
    1.5,
    1.0,
    { emissive: 0.3 },
  );
  add(g, paper, 0, 1.35, 0.07);
  return g;
}

// ---------------------------------------------------------------- land plots
export function lockedPlot(size, cost) {
  const g = new THREE.Group();
  add(g, box(size, 0.1, size, mat(0x9ee07a, { roughness: 1 }), 0.05), 0, 0.05, 0);
  const pegs = mat(0xffffff);
  const n = Math.round(size / 0.8);
  for (let i = 0; i <= n; i++) {
    const t = -size / 2 + (i * size) / n;
    for (const [x, z] of [
      [t, -size / 2],
      [t, size / 2],
      [-size / 2, t],
      [size / 2, t],
    ])
      add(g, cyl(0.05, 0.05, 0.4, pegs, 5), x, 0.25, z);
  }
  const post = cyl(0.07, 0.07, 1.6, mat(0x9a623e), 6);
  add(g, post, 0, 0.8, 0);
  const s = decal(
    textTexture(`${cost}★`, {
      bg: "#fffaf0",
      fg: "#f2a100",
      size: 120,
      w: 320,
      h: 180,
      radius: 50,
    }),
    1.6,
    0.9,
    { emissive: 0.4 },
  );
  s.userData.billboard = true;
  add(g, s, 0, 1.7, 0);
  return g;
}
export function openPlot(size) {
  const g = new THREE.Group();
  add(g, box(size, 0.12, size, mat(0xfff0c9, { roughness: 1 }), 0.08), 0, 0.06, 0);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(size * 0.3, size * 0.36, 40),
    new THREE.MeshBasicMaterial({
      color: 0xffd447,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  add(g, ring, 0, 0.14, 0);
  const plus = decal(textTexture("+", { fg: "#ffb400", size: 240, stroke: "#ffffff" }), 1.2, 1.2, {
    emissive: 0.6,
  });
  plus.rotation.x = -Math.PI / 2;
  add(g, plus, 0, 0.15, 0);
  return g;
}

// ---------------------------------------------------------------- skill buildings (5 levels)
// level 0 = scaffold + waiting worker (chưa vững), 1..3 = mastery bands, 4 = skyscraper (vững ≥ 30 ngày).
export function skillBuilding(theme, level, seed = 1) {
  return (theme === "viet" ? vietBuilding : mathBuilding)(level, seed);
}

function numberBlock(size, color, label, fg = "#ffffff") {
  const g = new THREE.Group();
  add(g, box(size, size, size, mat(color, { roughness: 0.55 }), size * 0.12), 0, size / 2, 0);
  const t = textTexture(label, { fg, size: 190, stroke: "rgba(0,0,0,0.12)" });
  for (const [x, z, ry] of [
    [0, size / 2 + 0.01, 0],
    [size / 2 + 0.01, 0, Math.PI / 2],
  ]) {
    const d = decal(t, size * 0.8, size * 0.8, { emissive: 0.1 });
    d.rotation.y = ry;
    add(g, d, x, size / 2, z);
  }
  return g;
}

function mathBuilding(level, seed) {
  const C = CITY.vmath;
  const r = rng(seed);
  const g = new THREE.Group();
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  if (level === 0) {
    add(g, box(4.6, 0.14, 4.6, mat(0xf2dca8), 0.06), 0, 0.07, 0);
    add(g, box(3.2, 1.1, 3.0, mat(C.walls[1]), 0.06), 0, 0.69, 0);
    add(g, scaffold(3.6, 3.4, 2.6), 0, 0.1, 0);
    add(g, numberBlock(0.7, C.blocks[0], "2"), -1.7, 0.1, 1.9);
    add(g, numberBlock(0.6, C.blocks[1], "5"), -1.0, 0.1, 2.1);
    add(g, numberBlock(0.55, C.blocks[3], "7"), -1.35, 0.8, 1.95);
    const w = worker();
    w.rotation.y = 0.6;
    add(g, w, 1.5, 0.14, 2.1);
    for (const [x, z] of [
      [2.2, -2.1],
      [-2.2, -2.1],
      [2.2, 1.2],
    ])
      add(g, cone(0.14, 0.4, mat(0xff9a2e), 8), x, 0.34, z);
    g.userData.top = 3.0;
    return g;
  }
  if (level === 1) {
    const b = building({
      w: 3.2,
      d: 3.0,
      floors: 2,
      wall: C.walls[0],
      roof: C.roofs[0],
      roofType: "flat",
      trim: C.trim,
      glass: C.glass,
      awning: C.roofs[2],
    });
    add(g, b);
    add(g, numberBlock(0.9, C.blocks[3], "1"), -0.6, b.userData.top + 0.28, -0.3);
    add(g, numberBlock(0.7, C.blocks[0], "2"), 0.5, b.userData.top + 0.28, 0.4);
    g.userData.top = b.userData.top + 1.2;
    return g;
  }
  if (level === 2) {
    // floors stacked like toy blocks, each a different colour, slight offsets
    const floors = 4;
    const fh = 1.15;
    let y = 0.18;
    add(g, box(3.8, 0.18, 3.6, mat(0xf0e8d4), 0.05), 0, 0.09, 0);
    for (let f = 0; f < floors; f++) {
      const c = C.blocks[(f + seed) % C.blocks.length];
      const fl = building({
        w: 3.2 - f * 0.12,
        d: 3.0 - f * 0.12,
        floors: 1,
        fh,
        wall: c,
        roof: C.roofs[0],
        roofType: f === floors - 1 ? "flat" : "none",
        trim: C.trim,
        glass: C.glass,
        plinth: 0.001,
        noDoor: f > 0,
        band: false,
      });
      fl.position.set(f % 2 ? 0.1 : -0.1, y, 0);
      g.add(fl);
      y += fh;
    }
    add(g, numberBlock(1.0, C.b, "5", "#2f5fb3"), 0.3, y + 0.28, 0);
    g.userData.top = y + 1.4;
    return g;
  }
  if (level === 3) {
    const b = building({
      w: 3.6,
      d: 3.2,
      floors: 6,
      fh: 1.12,
      wall: C.walls[1],
      roof: C.roofs[1],
      roofType: "flat",
      trim: C.trim,
      glass: C.glass,
      garden: true,
      storefront: C.b,
    });
    add(g, b);
    const wing = building({
      w: 2.0,
      d: 2.6,
      floors: 3,
      wall: C.walls[0],
      roof: C.roofs[0],
      roofType: "flat",
      trim: C.trim,
      glass: C.glass,
      noDoor: true,
    });
    add(g, wing, 2.7, 0, 0.1);
    const bill = decal(
      textTexture("10", { bg: "#ffd447", fg: "#2f5fb3", size: 170, w: 320, h: 256, radius: 40 }),
      1.8,
      1.44,
      { emissive: 0.4 },
    );
    add(g, box(2.0, 1.6, 0.12, mat(0x3f7de0), 0.05), 0, b.userData.top + 1.2, -0.8);
    add(g, bill, 0, b.userData.top + 1.2, -0.72);
    for (const x of [-0.7, 0.7])
      add(g, cyl(0.05, 0.05, 0.6, mat(0x46607a), 6), x, b.userData.top + 0.3, -0.8);
    g.userData.top = b.userData.top + 2.2;
    return g;
  }
  // level 4 — skyscraper with setbacks, curtain-wall glass, golden crown
  const glass = glassMat(0x6fc9ff);
  const fin = mat(C.b, { roughness: 0.45 });
  const white = mat(0xffffff);
  const tiers = [
    [3.8, 3.6, 7],
    [3.1, 2.9, 4],
    [2.3, 2.1, 2],
  ];
  let y = 0;
  const fh = 1.0;
  add(g, box(4.6, 0.3, 4.4, mat(0xf0e8d4), 0.05), 0, 0.15, 0);
  y = 0.3;
  add(g, box(4.0, 1.3, 3.8, mat(C.walls[2]), 0.06), 0, y + 0.65, 0);
  add(g, box(3.6, 1.0, 0.1, glassMat(0xa6eeff), 0.03), 0, y + 0.6, 1.92);
  y += 1.3;
  for (const [w, d, n] of tiers) {
    add(g, box(w, n * fh, d, glass, 0.06), 0, y + (n * fh) / 2, 0);
    for (let f = 0; f <= n; f++)
      add(g, box(w + 0.08, 0.1, d + 0.08, white, 0.03), 0, y + f * fh, 0);
    const nx = Math.round(w / 0.75);
    for (let i = 1; i < nx; i++) {
      const x = -w / 2 + (i * w) / nx;
      add(g, box(0.07, n * fh, 0.07, fin, 0.02), x, y + (n * fh) / 2, d / 2 + 0.03);
    }
    const nz = Math.round(d / 0.75);
    for (let i = 1; i < nz; i++) {
      const z = -d / 2 + (i * d) / nz;
      add(g, box(0.07, n * fh, 0.07, fin, 0.02), w / 2 + 0.03, y + (n * fh) / 2, z);
    }
    y += n * fh;
    add(g, box(w + 0.3, 0.22, d + 0.3, fin, 0.05), 0, y + 0.11, 0);
    y += 0.22;
  }
  add(g, cyl(0.9, 1.1, 0.8, fin, 8), 0, y + 0.4, 0);
  add(
    g,
    sphere(
      0.55,
      mat(0xffe066, { emissive: 0xffb000, emissiveIntensity: 0.6, roughness: 0.3 }),
      16,
      12,
    ),
    0,
    y + 1.25,
    0,
  );
  add(g, cyl(0.05, 0.05, 2.0, white, 6), 0, y + 2.6, 0);
  const t = decal(
    textTexture("100", { bg: "#2f5fb3", fg: "#ffd447", size: 150, w: 360, h: 200, radius: 40 }),
    1.8,
    1.0,
    { emissive: 0.6 },
  );
  add(g, t, 0, 1.3 + 7 * fh - 1.2, 1.86);
  g.userData.top = y + 3.6;
  return g;
}

function vietBuilding(level, seed) {
  const C = CITY.viet;
  const r = rng(seed);
  const g = new THREE.Group();
  const letters = ["a", "ă", "â", "b", "c", "đ", "ê", "ô", "ơ", "ư"];
  const letterSign = (ch, bg = "#6fae5a") =>
    decal(textTexture(ch, { bg, fg: "#ffffff", size: 180, w: 256, h: 256, radius: 60 }), 0.9, 0.9, {
      emissive: 0.25,
    });
  if (level === 0) {
    add(g, box(4.6, 0.14, 4.6, mat(0xf2dca8), 0.06), 0, 0.07, 0);
    add(g, box(3.2, 1.0, 2.8, mat(C.walls[0]), 0.06), 0, 0.64, 0);
    add(g, scaffold(3.6, 3.2, 2.4), 0, 0.1, 0);
    for (let i = 0; i < 3; i++)
      add(g, box(0.9, 0.18, 0.5, mat(C.roofs[i % 3]), 0.03), -1.7, 0.2 + i * 0.19, 1.9);
    const w = worker();
    w.rotation.y = 0.6;
    add(g, w, 1.5, 0.14, 2.1);
    for (const [x, z] of [
      [2.2, -2.1],
      [-2.2, -2.1],
      [2.2, 1.2],
    ])
      add(g, cone(0.14, 0.4, mat(0xff9a2e), 8), x, 0.34, z);
    g.userData.top = 2.8;
    return g;
  }
  if (level === 1) {
    const b = building({
      w: 3.0,
      d: 2.6,
      floors: 1,
      fh: 1.5,
      wall: C.walls[0],
      roof: C.roofs[0],
      roofType: "curved",
      trim: C.trim,
      glass: C.glass,
      door: 0xb5552f,
    });
    add(g, b);
    add(g, letterSign(letters[seed % letters.length]), -0.6, 1.1, 1.36);
    for (const x of [-1.3, 1.3]) add(g, lantern(0xff5a3c, 1.2), x, 0.95, 1.55);
    add(g, flowerBed(1.0, 0.4, seed), 1.0, 0, 1.75);
    g.userData.top = b.userData.top + 0.4;
    return g;
  }
  if (level === 2) {
    const b = building({
      w: 2.6,
      d: 3.0,
      floors: 2,
      fh: 1.3,
      wall: C.walls[2],
      roof: C.roofs[1],
      roofType: "curved",
      trim: C.trim,
      glass: C.glass,
      door: 0xb5552f,
    });
    add(g, b);
    add(g, box(2.8, 0.1, 0.7, mat(C.trim), 0.03), 0, 1.5, 1.8);
    for (let i = 0; i < 6; i++)
      add(g, cyl(0.03, 0.03, 0.45, mat(0x6fae5a), 5), -1.3 + i * 0.52, 1.75, 2.1);
    add(g, box(2.8, 0.06, 0.06, mat(0x6fae5a), 0.02), 0, 1.98, 2.12);
    for (const x of [-0.9, 0.2, 1.0]) add(g, flowerBed(0.36, 0.26, x * 10 + 5), x, 1.55, 1.95);
    add(g, letterSign(letters[(seed + 1) % letters.length], "#e76f51"), 0.9, 2.5, 1.56);
    add(g, lanternString(2.6, 5, 1.25), 0, 0, 1.9);
    g.userData.top = b.userData.top + 0.4;
    return g;
  }
  if (level === 3) {
    const base = building({
      w: 3.8,
      d: 3.2,
      floors: 2,
      fh: 1.3,
      wall: C.walls[0],
      roof: C.roofs[0],
      roofType: "none",
      trim: C.trim,
      glass: C.glass,
      columns: true,
      band: false,
      door: 0xb5552f,
    });
    add(g, base);
    add(g, curvedRoof(4.6, 4.2, 0.7, C.roofs[0], 0.3, 0.2), 0, base.userData.top - 0.05, 0);
    const up = building({
      w: 2.8,
      d: 2.4,
      floors: 1,
      fh: 1.3,
      wall: C.walls[4],
      roof: C.roofs[2],
      roofType: "curved",
      trim: C.trim,
      glass: C.glass,
      plinth: 0.001,
      noDoor: true,
      flare: 0.5,
    });
    add(g, up, 0, base.userData.top + 0.45, 0);
    add(
      g,
      decal(
        textTexture("Â", { bg: "#6fae5a", fg: "#ffffff", size: 170, w: 256, h: 256, radius: 60 }),
        1.0,
        1.0,
        { emissive: 0.3 },
      ),
      0,
      base.userData.top + 1.1,
      1.25,
    );
    add(g, lanternString(4.0, 7, 2.75), 0, 0, 2.2);
    g.userData.top = base.userData.top + up.userData.top + 0.6;
    return g;
  }
  // level 4 — tower with stacked curved-eave tiers and a golden finial
  const tiers = [
    [3.8, 3.6, 3],
    [3.3, 3.1, 3],
    [2.8, 2.6, 2],
    [2.2, 2.0, 2],
  ];
  let y = 0;
  add(g, box(4.8, 0.3, 4.6, mat(0xf0e8d4), 0.05), 0, 0.15, 0);
  y = 0.3;
  tiers.forEach(([w, d, n], i) => {
    const b = building({
      w,
      d,
      floors: n,
      fh: 1.05,
      wall: i % 2 ? C.walls[1] : C.walls[4],
      roof: C.roofs[0],
      roofType: "none",
      trim: C.trim,
      glass: 0x9fe8ff,
      plinth: 0.001,
      noDoor: i > 0,
      band: true,
    });
    add(g, b, 0, y, 0);
    y += n * 1.05;
    add(g, curvedRoof(w + 0.5, d + 0.5, 0.45, C.roofs[i % 3], 0.35, 0.1), 0, y - 0.02, 0);
    y += 0.3;
  });
  add(g, curvedRoof(2.4, 2.2, 1.2, C.roofs[0], 0.4, 0.2), 0, y, 0);
  y += 1.2;
  add(g, cyl(0.06, 0.12, 1.2, mat(0xffd447, { metalness: 0.4, roughness: 0.3 }), 8), 0, y + 0.5, 0);
  add(
    g,
    sphere(0.28, mat(0xffe066, { emissive: 0xffb000, emissiveIntensity: 0.6 }), 14, 10),
    0,
    y + 1.2,
    0,
  );
  add(
    g,
    decal(
      textTexture("Ư", { bg: "#e76f51", fg: "#ffffff", size: 170, w: 256, h: 256, radius: 60 }),
      0.8,
      0.8,
      { emissive: 0.3 },
    ),
    0.9,
    2.92,
    1.92,
  );
  g.userData.top = y + 1.6;
  return g;
}

// ---------------------------------------------------------------- public buildings (≥ 12, badge-unlocked)
export function school(C) {
  const g = new THREE.Group();
  const b = building({
    w: 6.4,
    d: 3.2,
    floors: 2,
    fh: 1.3,
    wall: 0xfff1d6,
    roof: C.a,
    roofType: "hip",
    trim: 0xffffff,
    glass: C.glass,
    signText: "TRƯỜNG HỌC",
    signBg: "#ffffff",
    signFg: "#2f5fb3",
  });
  add(g, b);
  add(
    g,
    building({
      w: 1.8,
      d: 1.8,
      floors: 3,
      fh: 1.3,
      wall: C.b,
      roof: C.a,
      roofType: "hip",
      trim: 0xffffff,
      glass: C.glass,
      noDoor: true,
      clock: 0,
    }),
    0,
    0,
    -0.3,
  );
  add(g, box(7.4, 0.06, 3.4, mat(0xffc7a0, { roughness: 1 }), 0.02), 0, 0.03, 3.6);
  add(g, flag(0xffd447, 3.4), -3.0, 0, 2.4);
  const bs = bus(0xffc93c);
  bs.rotation.y = 0;
  add(g, bs, 1.6, 0.03, 3.9);
  for (const [x, z, c] of [
    [-1.2, 3.2, 0xff6f61],
    [-0.5, 3.8, 0x5e93d6],
    [-1.8, 4.2, 0x6fcf5a],
  ]) {
    const p = person(c, { h: 0.7 });
    p.rotation.y = x;
    add(g, p, x, 0.06, z);
  }
  return g;
}
export function library(C) {
  const g = new THREE.Group();
  add(
    g,
    building({
      w: 5.0,
      d: 3.6,
      floors: 2,
      fh: 1.35,
      wall: 0xf1e9ff,
      roof: 0x8e7cc3,
      roofType: "flat",
      trim: 0xffffff,
      glass: C.glass,
      columns: true,
      band: false,
      dome: 0x8e7cc3,
      signText: "THƯ VIỆN",
      signBg: "#8e7cc3",
      signFg: "#ffffff",
    }),
  );
  for (let i = 0; i < 4; i++)
    add(
      g,
      box(0.5, 0.12 + i * 0.02, 0.35, mat([0xff6f61, 0xffd447, 0x5e93d6, 0x6fcf5a][i]), 0.02),
      -2.2 + i * 0.6,
      0.1,
      3.0,
    );
  return g;
}
export function playground() {
  const g = new THREE.Group();
  add(g, box(7, 0.08, 6, mat(0xffb98a, { roughness: 1 }), 0.05), 0, 0.04, 0);
  // slide tower
  add(g, box(1.4, 0.12, 1.4, mat(0xffd447), 0.04), -1.8, 1.6, -1.2);
  for (const [x, z] of [
    [-2.4, -1.8],
    [-1.2, -1.8],
    [-2.4, -0.6],
    [-1.2, -0.6],
  ])
    add(g, cyl(0.07, 0.07, 1.6, mat(0x5e93d6), 8), x, 0.8, z);
  const roof = cone(1.1, 0.9, mat(0xff6f61), 4);
  roof.rotation.y = Math.PI / 4;
  add(g, roof, -1.8, 2.9, -1.2);
  for (const [x, z] of [
    [-2.4, -1.8],
    [-1.2, -1.8],
    [-2.4, -0.6],
    [-1.2, -0.6],
  ])
    add(g, cyl(0.05, 0.05, 1.0, mat(0x5e93d6), 6), x, 2.1, z);
  const slide = box(0.8, 0.08, 2.8, mat(0x6fcf5a, { roughness: 0.4 }), 0.04);
  slide.rotation.x = 0.55;
  add(g, slide, -1.8, 0.85, 0.9);
  // swings
  add(g, box(3.2, 0.12, 0.12, mat(0xff6f61), 0.04), 1.6, 2.2, -1.5);
  for (const x of [0.1, 3.1]) {
    const l = box(0.1, 2.3, 0.1, mat(0xff6f61), 0.03);
    add(g, l, x, 1.1, -1.5);
  }
  for (const x of [0.9, 2.3]) {
    add(g, box(0.02, 1.4, 0.02, mat(0x555555), 0.005), x - 0.25, 1.5, -1.5);
    add(g, box(0.02, 1.4, 0.02, mat(0x555555), 0.005), x + 0.25, 1.5, -1.5);
    add(g, box(0.6, 0.08, 0.3, mat(0xffd447), 0.03), x, 0.8, -1.5);
  }
  // seesaw + sandbox
  const ss = box(2.4, 0.1, 0.3, mat(0xb283e0), 0.04);
  ss.rotation.z = 0.2;
  add(g, ss, 1.7, 0.55, 1.2);
  add(g, cone(0.3, 0.45, mat(0x5e93d6), 4), 1.7, 0.25, 1.2);
  add(g, box(1.8, 0.24, 1.8, mat(0xffffff), 0.06), -1.8, 0.12, 1.9);
  add(g, box(1.5, 0.1, 1.5, mat(WORLD.sand), 0.04), -1.8, 0.24, 1.9);
  for (const [x, z, c] of [
    [0.8, 0.2, 0xff6f61],
    [2.6, 0.6, 0x5e93d6],
    [-0.6, 2.2, 0xffd447],
  ]) {
    const p = person(c, { h: 0.65 });
    p.rotation.y = x * 2;
    add(g, p, x, 0.08, z);
  }
  return g;
}
export function pool() {
  const g = new THREE.Group();
  add(g, box(7, 0.2, 5, mat(0xffffff), 0.08), 0, 0.1, 0);
  add(
    g,
    box(
      5.6,
      0.08,
      3.6,
      mat(0x5fd3f7, {
        roughness: 0.1,
        metalness: 0.1,
        emissive: 0x2aa9d8,
        emissiveIntensity: 0.25,
      }),
      0.05,
    ),
    0,
    0.2,
    0,
  );
  for (let i = 1; i < 4; i++)
    add(g, box(5.4, 0.03, 0.06, mat(i % 2 ? 0xff6f61 : 0xffd447), 0.01), 0, 0.26, -1.8 + i * 0.9);
  for (const x of [-2.2, -1.0]) {
    const um = cone(0.9, 0.35, mat(x < -1.5 ? 0xff8fb1 : 0xffd447), 10);
    add(g, um, x, 1.6, 2.4 + 0.3);
    add(g, cyl(0.03, 0.03, 1.5, mat(0xffffff), 6), x, 0.9, 2.7);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.12, 8, 16), mat(0xff6f61));
  ring.rotation.x = Math.PI / 2;
  add(g, ring, 1.2, 0.3, 0.5);
  const slide = box(0.6, 0.08, 2.2, mat(0x5e93d6, { roughness: 0.3 }), 0.03);
  slide.rotation.x = -0.5;
  add(g, slide, 2.8, 0.8, -1.2);
  return g;
}
export function footballField() {
  const g = new THREE.Group();
  add(g, box(9.2, 0.08, 6, mat(0x55c83c, { roughness: 1 }), 0.03), 0, 0.04, 0);
  for (let i = 0; i < 6; i++)
    add(
      g,
      box(9.2 / 6 - 0.02, 0.01, 5.98, mat(i % 2 ? 0x5fd446 : 0x4fbf38, { roughness: 1 }), 0.001),
      -4.6 + ((i + 0.5) * 9.2) / 6,
      0.085,
      0,
    );
  const line = mat(0xffffff);
  add(g, box(8.4, 0.02, 0.08, line, 0.01), 0, 0.1, -2.6);
  add(g, box(8.4, 0.02, 0.08, line, 0.01), 0, 0.1, 2.6);
  add(g, box(0.08, 0.02, 5.2, line, 0.01), -4.2, 0.1, 0);
  add(g, box(0.08, 0.02, 5.2, line, 0.01), 4.2, 0.1, 0);
  add(g, box(0.08, 0.02, 5.2, line, 0.01), 0, 0.1, 0);
  const circle = new THREE.Mesh(
    new THREE.RingGeometry(0.9, 1.0, 32),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  );
  circle.rotation.x = -Math.PI / 2;
  add(g, circle, 0, 0.11, 0);
  for (const s of [-1, 1]) {
    add(g, box(0.08, 0.9, 0.08, line, 0.02), s * 4.2, 0.45, -0.8);
    add(g, box(0.08, 0.9, 0.08, line, 0.02), s * 4.2, 0.45, 0.8);
    add(g, box(0.08, 0.08, 1.7, line, 0.02), s * 4.2, 0.9, 0);
  }
  add(g, sphere(0.16, mat(0xffffff), 10, 8), 1.2, 0.26, 0.4);
  for (const [x, z, c] of [
    [-2, -1, 0xff6f61],
    [-1, 1.2, 0xff6f61],
    [2, -0.4, 0x5e93d6],
    [2.8, 1.0, 0x5e93d6],
  ]) {
    const p = person(c, { h: 0.7 });
    p.rotation.y = x;
    add(g, p, x, 0.1, z);
  }
  return g;
}
export function circusTent() {
  const g = new THREE.Group();
  const geo = new THREE.CylinderGeometry(3, 3, 1.8, 16, 1, true);
  geo.clearGroups();
  for (let i = 0; i < 16; i++) geo.addGroup(i * 6, 6, i % 2);
  const wall = new THREE.Mesh(geo, [
    mat(0xff6f61, { side: THREE.DoubleSide }),
    mat(0xffffff, { side: THREE.DoubleSide }),
  ]);
  wall.castShadow = true;
  add(g, wall, 0, 0.9, 0);
  const rg = new THREE.ConeGeometry(3.4, 2.6, 16, 1, true);
  rg.clearGroups();
  for (let i = 0; i < 16; i++) rg.addGroup(i * 3, 3, i % 2);
  const rf = new THREE.Mesh(rg, [
    mat(0xffd447, { side: THREE.DoubleSide }),
    mat(0xff6f61, { side: THREE.DoubleSide }),
  ]);
  rf.castShadow = true;
  add(g, rf, 0, 3.1, 0);
  add(g, flag(0x5e93d6, 1.2), 0, 4.3, 0);
  add(g, box(1.2, 1.3, 0.2, mat(0x5e2a4a), 0.05), 0, 0.65, 2.95);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    add(
      g,
      sphere(
        0.14,
        mat([0xff6f61, 0xffd447, 0x5e93d6, 0x6fcf5a][i % 4], {
          emissive: 0xffffff,
          emissiveIntensity: 0.15,
        }),
        8,
        6,
      ),
      Math.cos(a) * 3.05,
      1.85,
      Math.sin(a) * 3.05,
    );
  }
  return g;
}
export function station(C) {
  const g = new THREE.Group();
  add(
    g,
    building({
      w: 5.4,
      d: 2.6,
      floors: 1,
      fh: 1.8,
      wall: 0xfff1d6,
      roof: C.a,
      roofType: "gable",
      trim: 0xffffff,
      glass: C.glass,
      clock: 0,
      signText: "GA TÀU",
      signBg: "#ffd447",
      signFg: "#2f5fb3",
    }),
  );
  add(g, box(8, 0.3, 1.6, mat(0xe6dccb), 0.04), 0, 0.15, 2.3);
  for (const x of [-3, -1, 1, 3]) add(g, cyl(0.06, 0.06, 1.5, mat(0x46607a), 6), x, 1.0, 2.8);
  add(g, box(8, 0.1, 1.4, mat(C.b), 0.04), 0, 1.8, 2.5);
  return g;
}
export function train(colors = [0xff6f61, 0xffd447, 0x5e93d6]) {
  const g = new THREE.Group();
  colors.forEach((c, i) => {
    const car = new THREE.Group();
    add(car, box(2.6, 1.1, 1.2, mat(c, { roughness: 0.4 }), 0.18), 0, 0.85, 0);
    add(car, box(2.64, 0.12, 1.24, mat(0xffffff), 0.04), 0, 0.55, 0);
    for (let k = 0; k < 3; k++) {
      add(car, box(0.5, 0.44, 0.06, glassMat(), 0.03), -0.8 + k * 0.8, 1.05, 0.61);
    }
    for (const x of [-0.8, 0.8]) {
      add(car, wheel(0.22, 0.14), x, 0.24, 0.5);
      add(car, wheel(0.22, 0.14), x, 0.24, -0.5);
    }
    if (i === 0) {
      add(car, box(0.8, 0.6, 1.0, glassMat(), 0.2), 1.2, 1.1, 0);
      add(car, cyl(0.18, 0.22, 0.5, mat(0x46607a), 8), 0.6, 1.6, 0);
    }
    add(g, car, -i * 2.8, 0, 0);
  });
  return g;
}
export function rails(len) {
  const g = new THREE.Group();
  add(g, box(len, 0.08, 1.8, mat(0xd8cdb8, { roughness: 1 }), 0.02), 0, 0.04, 0);
  for (let i = 0; i < len / 0.7; i++)
    add(g, box(0.18, 0.06, 1.5, mat(0xa8703f), 0.02), -len / 2 + i * 0.7, 0.1, 0);
  for (const z of [-0.5, 0.5])
    add(
      g,
      box(len, 0.08, 0.08, mat(0x8a96a8, { metalness: 0.5, roughness: 0.4 }), 0.02),
      0,
      0.17,
      z,
    );
  return g;
}
export function market(C) {
  // chợ
  const g = new THREE.Group();
  const cols = [
    [C.a, 0xffffff],
    [C.b, 0xffffff],
    [0xffc93c, 0xffffff],
    [0x5fb8e8, 0xffffff],
  ];
  cols.forEach(([c1, c2], i) => {
    const x = (i % 2) * 2.4 - 1.2,
      z = Math.floor(i / 2) * 2.4 - 1.2;
    const st = new THREE.Group();
    add(st, box(1.8, 0.7, 1.0, mat(0xc98f5e), 0.05), 0, 0.35, 0);
    for (const [dx, dz] of [
      [-0.8, -0.45],
      [0.8, -0.45],
      [-0.8, 0.45],
      [0.8, 0.45],
    ])
      add(st, cyl(0.04, 0.04, 1.6, mat(0xffffff), 6), dx, 0.8, dz);
    for (let k = 0; k < 5; k++) {
      const a = box(0.4, 0.06, 1.3, mat(k % 2 ? c2 : c1), 0.02);
      a.rotation.x = 0;
      add(st, a, -0.8 + k * 0.4, 1.65, 0);
    }
    const fruit = [0xff7043, 0xffd447, 0x6fcf5a, 0xff8fb1];
    for (let k = 0; k < 6; k++)
      add(st, sphere(0.11, mat(fruit[(k + i) % 4]), 8, 6), -0.6 + k * 0.24, 0.8, 0.1);
    add(g, st, x, 0, z);
  });
  for (const [x, z, c] of [
    [0, 0, 0xff6f61],
    [1.4, 1.6, 0x5e93d6],
    [-1.6, 1.8, 0xffd447],
  ]) {
    const p = person(c, { h: 0.9 });
    p.rotation.y = x;
    add(g, p, x, 0, z);
  }
  return g;
}
export function zoo() {
  const g = new THREE.Group();
  add(g, box(6.4, 0.08, 5, mat(0xbdeb7a, { roughness: 1 }), 0.03), 0, 0.04, 0);
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const t = -3.2 + (i * 6.4) / n;
    for (const z of [-2.5, 2.5]) add(g, cyl(0.05, 0.05, 0.7, mat(0xa8703f), 5), t, 0.35, z);
  }
  for (const z of [-2.5, 2.5]) add(g, box(6.4, 0.06, 0.06, mat(0xa8703f), 0.02), 0, 0.6, z);
  // giraffe
  const gir = new THREE.Group();
  const y = mat(0xffc93c);
  const sp = mat(0xc47a2a);
  add(gir, box(1.1, 0.6, 0.5, y, 0.15), 0, 1.3, 0);
  for (const [x, z] of [
    [-0.4, 0.18],
    [0.4, 0.18],
    [-0.4, -0.18],
    [0.4, -0.18],
  ])
    add(gir, box(0.12, 1.0, 0.12, y, 0.04), x, 0.5, z);
  const neck = box(0.22, 1.5, 0.22, y, 0.08);
  neck.rotation.z = -0.35;
  add(gir, neck, 0.62, 2.1, 0);
  add(gir, box(0.5, 0.28, 0.28, y, 0.1), 0.98, 2.85, 0);
  for (const [x, yy] of [
    [-0.2, 1.45],
    [0.25, 1.35],
    [0.1, 1.55],
  ])
    add(gir, box(0.18, 0.04, 0.52, sp, 0.02), x, yy, 0);
  add(g, gir, -1.4, 0.08, 0);
  // elephant
  const el = new THREE.Group();
  const gr = mat(0xa9b8d0);
  add(el, box(1.5, 1.0, 0.9, gr, 0.3), 0, 1.0, 0);
  for (const [x, z] of [
    [-0.5, 0.3],
    [0.5, 0.3],
    [-0.5, -0.3],
    [0.5, -0.3],
  ])
    add(el, cyl(0.17, 0.17, 0.6, gr, 8), x, 0.3, z);
  add(el, sphere(0.45, gr, 12, 10), 0.85, 1.2, 0);
  const tr = cyl(0.08, 0.12, 0.8, gr, 8);
  tr.rotation.z = 0.3;
  add(el, tr, 1.25, 0.8, 0);
  for (const z of [-0.45, 0.45]) {
    const ear = box(0.08, 0.6, 0.5, mat(0xc4d0e2), 0.1);
    add(el, ear, 0.7, 1.25, z);
  }
  add(g, el, 1.4, 0.08, 0.6);
  for (const [x, z] of [
    [-2.6, 1.6],
    [2.6, -1.6],
  ])
    add(g, tree(1.1, WORLD.leaves[1], x * 7), x, 0.08, z);
  return g;
}
export function ferrisWheel() {
  const g = new THREE.Group();
  const R = 3.2;
  const white = mat(0xffffff);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.1, 8, 40), mat(0xff8fb1));
  ring.castShadow = true;
  add(g, ring, 0, R + 1.0, 0);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const sp = box(R, 0.06, 0.06, white, 0.01);
    sp.rotation.z = a;
    add(g, sp, (Math.cos(a) * R) / 2, R + 1.0 + (Math.sin(a) * R) / 2, 0);
    const cab = box(
      0.5,
      0.5,
      0.5,
      mat([0xff6f61, 0xffd447, 0x5e93d6, 0x6fcf5a, 0xb283e0][i % 5]),
      0.12,
    );
    add(g, cab, Math.cos(a) * R, R + 0.7 + Math.sin(a) * R, 0.1);
  }
  for (const s of [-1, 1]) {
    const leg = box(0.15, R + 1.4, 0.15, white, 0.04);
    leg.rotation.z = s * 0.3;
    add(g, leg, s * 0.6, (R + 1.0) / 2, -0.35);
  }
  return g;
}
export function townHall(C, { lanterns = false } = {}) {
  const g = new THREE.Group();
  const b = building({
    w: 6.0,
    d: 3.8,
    floors: 2,
    fh: 1.4,
    wall: 0xfffaf0,
    roof: C.a,
    roofType: "flat",
    trim: 0xffffff,
    glass: C.glass,
    columns: true,
    band: false,
    clock: 3.0,
    signText: "TOÀ THỊ CHÍNH",
    signBg: "#ffffff",
    signFg: "#2f5fb3",
  });
  add(g, b);
  add(g, box(4.4, 0.12, 2.2, mat(0xfff0c9), 0.03), 0, 0.06, 3.6);
  add(g, flag(C.a, 3.0), -3.4, 0, 2.6);
  add(g, flag(C.b, 3.0), 3.4, 0, 2.6);
  const ob = orderBoard();
  ob.rotation.y = -0.35;
  add(g, ob, 2.3, 0, 3.8);
  if (lanterns) add(g, lanternString(6, 9, 3.0), 0, 0, 2.8);
  g.userData.top = b.userData.top;
  return g;
}

// ---------------------------------------------------------------- city gate with the city's name
export function cityGate(C, theme, width = 7) {
  const g = new THREE.Group();
  const h = 4.6;
  const pillar = mat(theme === "viet" ? 0xe76f51 : C.a, { roughness: 0.6 });
  for (const s of [-1, 1]) {
    add(g, box(0.9, 0.5, 0.9, mat(0xfff6e4), 0.08), (s * width) / 2, 0.25, 0);
    add(g, box(0.6, h, 0.6, pillar, 0.1), (s * width) / 2, h / 2 + 0.3, 0);
    if (theme === "viet")
      add(g, curvedRoof(1.0, 1.0, 0.45, 0x5c7a8a, 0.25, 0.2), (s * width) / 2, h + 0.3, 0);
    else
      add(
        g,
        numberBlockPublic(0.9, s < 0 ? C.blocks[0] : C.blocks[2], s < 0 ? "1" : "2"),
        (s * width) / 2,
        h + 0.3,
        0,
      );
  }
  add(g, box(width + 1.2, 0.3, 0.7, pillar, 0.08), 0, h - 0.1, 0);
  const sign = decal(
    textTexture(C.name.toUpperCase(), {
      bg: "#fffaf0",
      fg: theme === "viet" ? "#c2432f" : "#2f5fb3",
      size: 120,
      w: 900,
      h: 200,
      radius: 60,
    }),
    width * 0.8,
    (width * 0.8 * 200) / 900,
    { emissive: 0.35 },
  );
  add(
    g,
    box(
      width * 0.84,
      (width * 0.8 * 200) / 900 + 0.2,
      0.2,
      mat(theme === "viet" ? 0xffc93c : C.b),
      0.08,
    ),
    0,
    h + 0.75,
    0,
  );
  add(g, sign, 0, h + 0.75, 0.12);
  if (theme === "viet")
    add(g, curvedRoof(width * 0.9, 1.2, 0.8, 0xe76f51, 0.45, 0.3), 0, h + 1.35, 0);
  else
    for (let i = 0; i < 5; i++)
      add(
        g,
        numberBlockPublic(0.6, C.blocks[i % C.blocks.length], ["+", "−", "×", "=", "÷"][i]),
        -1.6 + i * 0.8,
        h + 1.4,
        0,
      );
  return g;
}
function numberBlockPublic(size, color, label) {
  return numberBlock(size, color, label);
}

// ---------------------------------------------------------------- banyan (cây đa)
export function banyan(size = 1) {
  const g = new THREE.Group();
  const trunk = mat(0x9a6a45, { flatShading: true });
  add(g, cyl(0.45 * size, 0.8 * size, 2.2 * size, trunk, 9), 0, 1.1 * size, 0);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const root = cyl(0.05 * size, 0.07 * size, 2.2 * size, trunk, 5);
    add(g, root, Math.cos(a) * 1.6 * size, 1.1 * size, Math.sin(a) * 1.6 * size);
  }
  const leaf = [0x3fae3a, 0x55c83f, 0x6fd64a];
  const r = rng(11);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const m = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.1 * size, 0),
      mat(leaf[i % 3], { flatShading: true }),
    );
    m.castShadow = true;
    m.scale.set(1.2, 0.7, 1.2);
    add(g, m, Math.cos(a) * 1.5 * size, (2.6 + r() * 0.5) * size, Math.sin(a) * 1.5 * size);
  }
  const top = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.6 * size, 0),
    mat(leaf[1], { flatShading: true }),
  );
  top.castShadow = true;
  top.scale.set(1.2, 0.8, 1.2);
  add(g, top, 0, 3.4 * size, 0);
  return g;
}

// ---------------------------------------------------------------- wonders (ghép mảnh)
const ghostMat = new THREE.MeshBasicMaterial({
  color: 0xcfeaff,
  transparent: true,
  opacity: 0.5,
  depthWrite: false,
});
const ghostLine = new THREE.LineBasicMaterial({ color: 0x4f9be0, transparent: true, opacity: 0.9 });
function ghostify(obj) {
  obj.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = false;
    o.receiveShadow = false;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 30), ghostLine);
    o.material = ghostMat;
    o.add(edges);
  });
  return obj;
}
// pieces: array of builder fns (each returns a Group placed in wonder-local space). built = how many are done.
function assembleWonder(pieces, built, { scaffoldSize = null, craneAt = null } = {}) {
  const g = new THREE.Group();
  pieces.forEach((fn, i) => {
    const p = fn();
    if (i >= built) ghostify(p);
    g.add(p);
  });
  if (built < pieces.length && scaffoldSize) {
    const [w, d, h, y] = scaffoldSize(built);
    add(g, scaffold(w, d, h), 0, y, 0);
    if (craneAt) {
      const c = crane(craneAt[3], 5);
      c.rotation.y = craneAt[4] ?? 0;
      add(g, c, craneAt[0], craneAt[1], craneAt[2]);
    }
    const w1 = worker();
    add(g, w1, w / 2 + 0.8, y, d / 2 + 0.6);
  }
  return g;
}
// Kim tự tháp — 7 stepped layers + golden capstone = 8 pieces
export function pyramid(built) {
  const layers = 7,
    base = 9,
    step = 1.15,
    lh = 0.95;
  const stone = [0xffd98a, 0xffcf6e];
  const pieces = [];
  for (let i = 0; i < layers; i++) {
    pieces.push(() => {
      const s = base - i * step;
      const p = new THREE.Group();
      add(p, box(s, lh, s, mat(stone[i % 2], { roughness: 0.9 }), 0.08), 0, i * lh + lh / 2, 0);
      for (let k = -1; k <= 1; k += 2)
        add(
          p,
          box(s * 0.98, 0.06, 0.06, mat(0xe9b85a), 0.01),
          0,
          i * lh + lh * (0.5 + k * 0.25),
          s / 2 + 0.01,
        );
      return p;
    });
  }
  pieces.push(() => {
    const p = new THREE.Group();
    const c = cone(
      1.2,
      1.4,
      mat(0xffe066, {
        emissive: 0xffb000,
        emissiveIntensity: 0.55,
        roughness: 0.3,
        metalness: 0.2,
      }),
      4,
    );
    c.rotation.y = Math.PI / 4;
    add(p, c, 0, layers * lh + 0.7, 0);
    return p;
  });
  const g = assembleWonder(pieces, built, {
    scaffoldSize: (b) => {
      const i = Math.min(b, layers - 1);
      const s = base - i * step + 0.6;
      return [s, s, lh * 1.8, i * lh];
    },
    craneAt: [base / 2 + 1.5, 0, -base / 2 + 0.6, 9, 2.4],
  });
  add(g, box(base + 3, 0.16, base + 3, mat(WORLD.sand, { roughness: 1 }), 0.05), 0, 0.08 - 0.1, 0);
  g.userData.total = pieces.length;
  return g;
}
// Chùa Một Cột — 6 pieces: pond, pillar, lotus brackets, hall, roof, finial & dragons
export function onePillarPagoda(built) {
  const pieces = [
    () => {
      const p = new THREE.Group();
      add(p, box(8, 0.35, 8, mat(0xe8dcc4), 0.08), 0, 0.17, 0);
      add(
        p,
        box(7.2, 0.12, 7.2, mat(0x4fc6f0, { roughness: 0.15, metalness: 0.1 }), 0.05),
        0,
        0.33,
        0,
      );
      for (const [x, z] of [
        [-2.4, 2.2],
        [2.5, -2.3],
        [-2.6, -1.8],
        [2.2, 2.6],
      ]) {
        const lp = cyl(0.5, 0.5, 0.04, mat(0x6fcf5a), 10);
        add(p, lp, x, 0.42, z);
        add(p, sphere(0.18, mat(0xff9ec7), 8, 6), x + 0.1, 0.55, z);
      }
      return p;
    },
    () => {
      const p = new THREE.Group();
      add(p, cyl(0.42, 0.48, 3.0, mat(0xf2ead8, { roughness: 0.95 }), 16), 0, 1.8, 0);
      return p;
    },
    () => {
      const p = new THREE.Group();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const br = box(1.4, 0.12, 0.14, mat(0x9a4a2a), 0.03);
        br.rotation.y = -a;
        br.rotation.z = 0.5;
        add(p, br, Math.cos(a) * 0.65, 3.0, Math.sin(a) * 0.65);
      }
      add(p, box(2.8, 0.18, 2.8, mat(0x9a4a2a), 0.04), 0, 3.4, 0);
      return p;
    },
    () => {
      const p = new THREE.Group();
      add(p, box(2.2, 1.3, 2.2, mat(0xa8452c), 0.06), 0, 4.15, 0);
      for (const [x, z, ry] of [
        [0, 1.12, 0],
        [1.12, 0, Math.PI / 2],
      ]) {
        const d = box(1.2, 0.9, 0.06, mat(0xffc93c), 0.03);
        d.rotation.y = ry;
        add(p, d, x, 4.15, z);
      }
      add(p, box(3.0, 0.14, 3.0, mat(0x7a3a22), 0.03), 0, 3.55, 0);
      return p;
    },
    () => {
      const p = new THREE.Group();
      add(p, curvedRoof(2.6, 2.6, 1.0, 0x5c7a8a, 0.55, 0.45), 0, 4.8, 0);
      return p;
    },
    () => {
      const p = new THREE.Group();
      add(p, cyl(0.08, 0.14, 0.6, mat(0xffd447, { metalness: 0.4, roughness: 0.3 }), 8), 0, 6.1, 0);
      add(
        p,
        sphere(0.25, mat(0xffe066, { emissive: 0xffb000, emissiveIntensity: 0.6 }), 12, 10),
        0,
        6.5,
        0,
      );
      for (const s of [-1, 1]) {
        const dr = box(1.2, 0.14, 0.14, mat(0xffd447, { metalness: 0.3 }), 0.05);
        dr.rotation.z = s * 0.25;
        add(p, dr, s * 0.55, 5.95, 0);
      }
      return p;
    },
  ];
  const g = assembleWonder(pieces, built, {
    scaffoldSize: (b) => [3.4, 3.4, 3.2, 2.9],
    craneAt: [4.6, 0, -3.8, 8, 2.4],
  });
  g.userData.total = pieces.length;
  return g;
}

// ---------------------------------------------------------------- roads from an ASCII map
// '#' road; neighbours pick straight / T / cross / end, rotated as measured in probe (see README).
export function roadsFromMap(rows, spec, isRoad = (ch) => ch === "#" || ch === "=") {
  const g = new THREE.Group();
  const H = rows.length,
    W = rows[0].length;
  const at = (x, z) => (z >= 0 && z < H && x >= 0 && x < W ? rows[z][x] : " ");
  for (let z = 0; z < H; z++)
    for (let x = 0; x < W; x++) {
      if (!isRoad(at(x, z))) continue;
      const n = isRoad(at(x, z - 1)),
        s = isRoad(at(x, z + 1)),
        e = isRoad(at(x + 1, z)),
        w = isRoad(at(x - 1, z));
      const cnt = n + s + e + w;
      let name = "road-straight",
        rot = 0;
      if (cnt === 4) name = "road-crossroad";
      else if (cnt === 3) {
        name = "road-intersection";
        rot = !n ? 0 : !e ? -Math.PI / 2 : !s ? Math.PI : Math.PI / 2;
      } else if (cnt === 2 && ((n && s) || (e && w))) {
        name = "road-straight";
        rot = n ? Math.PI / 2 : 0;
      } else if (cnt === 2) {
        name = "road-crossroad";
      } else if (cnt === 1) {
        name = "road-end";
        rot = e ? 0 : n ? Math.PI / 2 : w ? Math.PI : -Math.PI / 2;
      } else name = "road-square";
      if (at(x, z) === "=") name = "road-crossing";
      const t = kenney("roads", name, { rot, spec, specKey: "road" });
      add(g, t, (x + 0.5) * TILE, 0.02, (z + 0.5) * TILE);
    }
  return g;
}

export const ROAD_SPEC = { road: 0x8793a8, curb: 0xfff3dd };

// face billboards toward the camera
export function faceCamera(scene, camera) {
  scene.traverse((o) => {
    if (o.userData.billboard) o.quaternion.copy(camera.quaternion);
  });
}
export function stats(renderer, scene) {
  let tris = 0,
    meshes = 0;
  scene.traverse((o) => {
    if (o.isMesh) {
      meshes++;
      const g = o.geometry;
      tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
    }
  });
  return {
    drawCalls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    meshes,
    sceneTris: Math.round(tris),
  };
}
