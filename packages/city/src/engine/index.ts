// Browser engine for one subject city. The kid UI (việc 4) owns the page; this owns the canvas.
//
//   const engine = await createCityEngine(canvas, { assetsBase: "/art/city" });
//   engine.setView(view);            // rebuilds only when the view changes
//   engine.on("tap", (target) => …);  // skill / public / plot / townHall / wonder
//   engine.anchors();                // screen positions for HTML mission bubbles (≥ 64 px buttons)

import type { CityView } from "@mtct/core";
import {
  AmbientLight,
  BackSide,
  CanvasTexture,
  Color,
  DirectionalLight,
  DoubleSide,
  DynamicDrawUsage,
  Fog,
  HemisphereLight,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshDepthMaterial,
  MeshStandardMaterial,
  NoToneMapping,
  type Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Quaternion,
  RGBADepthPacking,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import type { MaterialGroup } from "../build/bake";
import { KenneyLibrary } from "../build/kenney";
import { ATLAS_SIZE, canvasPainter, SignAtlas } from "../build/signs";
import { type BuiltCity, buildCity } from "../scene/build-city";
import { AGENT_MAX, buildAgentTemplates } from "./agents";
import { applyCamera, CAMERA, type CameraState, clampState, easeInOut, panDelta } from "./camera";
import { bend, createCurveUniforms } from "./curve";
import { type Lighting, lightingAt } from "./daynight";
import { pathLength, sampleAt } from "./paths";
import { surfaceShader } from "./surface";

export type TapTarget =
  | { type: "skill"; skillId: string }
  | { type: "public"; code: string }
  | { type: "plot"; plot: number }
  | { type: "townHall" }
  | { type: "wonder" };

export interface ScreenAnchor {
  id: string;
  x: number;
  y: number;
  visible: boolean;
}

export interface EngineStats {
  fps: number;
  frameMs: number;
  drawCalls: number;
  triangles: number;
  pixelRatio: number;
  buildMs: number;
}

export interface CityEngineOptions {
  assetsBase: string;
  /** Override the real clock (hours, 0–24) — for tests, previews and the bench. */
  hour?: number;
  maxPixelRatio?: number;
  shadowMapSize?: number;
  /** Start without the render loop (bench screenshots call renderOnce). */
  manualLoop?: boolean;
  lib?: KenneyLibrary;
}

export interface CityEngine {
  setView(view: CityView): void;
  setHour(hour: number | null): void;
  resize(): void;
  on(event: "tap", fn: (t: TapTarget) => void): void;
  anchors(ids?: string[]): ScreenAnchor[];
  flyTo(x: number, z: number, dist?: number, ms?: number): Promise<void>;
  focus(target: TapTarget, ms?: number): Promise<void>;
  /** The resting camera for this city: centred on the town, close for a small city, farther as it grows. */
  home(): CameraState;
  /** Session finale: one slow loop over the whole city, ending at `home()`. */
  tour(ms?: number): Promise<void>;
  /** Where a target sits: world centre and footprint (null when it is not in this city). */
  lotOf(target: TapTarget): { x: number; z: number; width: number; depth: number } | null;
  /** Flatten the target's building to the ground until `rise` (so it is not seen before it grows). */
  hold(target: TapTarget): void;
  /** Celebration: the target's building grows out of the ground with a springy overshoot. */
  rise(target: TapTarget, ms?: number): Promise<void>;
  /** The current frame as an image (JPEG data URL) — the blurred backdrop behind exercises. */
  snapshot(quality?: number): string;
  /** Stop/start the render loop (a sheet or exercise covers the city). */
  pause(paused: boolean): void;
  camera(): CameraState;
  setCamera(s: Partial<CameraState>): void;
  renderOnce(): void;
  stats(): EngineStats;
  dispose(): void;
}

export async function createCityEngine(
  canvas: HTMLCanvasElement,
  opts: CityEngineOptions,
): Promise<CityEngine> {
  const lib = opts.lib ?? (await KenneyLibrary.load(opts.assetsBase));
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
    preserveDrawingBuffer: !!opts.manualLoop,
  });
  const maxDpr = opts.maxPixelRatio ?? 2;
  let dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.info.autoReset = true;

  const scene = new Scene();
  const camera = new PerspectiveCamera(CAMERA.fov, 1, 1, 900);
  const uniforms = createCurveUniforms();
  const shared = { uWindow: { value: 0 }, uLights: { value: 0 } };

  // ---------------------------------------------------------------- materials per surface kind
  const atlasCanvas = document.createElement("canvas");
  atlasCanvas.width = ATLAS_SIZE;
  atlasCanvas.height = ATLAS_SIZE;
  const atlasCtx = atlasCanvas.getContext("2d") as CanvasRenderingContext2D;
  const atlasTexture = new CanvasTexture(atlasCanvas);
  atlasTexture.colorSpace = SRGBColorSpace;
  atlasTexture.anisotropy = 4;

  const materials: Record<MaterialGroup, MeshStandardMaterial | MeshBasicMaterial> = {
    opaque: bend(
      new MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.82,
        metalness: 0,
        emissive: 0xffffff,
      }),
      uniforms,
      surfaceShader(shared),
    ),
    sign: bend(
      new MeshStandardMaterial({
        map: atlasTexture,
        emissiveMap: atlasTexture,
        emissive: 0xffffff,
        emissiveIntensity: 0.28,
        transparent: true,
        alphaTest: 0.4,
        roughness: 0.6,
      }),
      uniforms,
    ),
    ghost: bend(
      new MeshBasicMaterial({
        color: 0xcfeaff,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      }),
      uniforms,
    ),
    cloud: new MeshStandardMaterial({
      color: 0xffffff,
      roughness: 1,
      flatShading: true,
      emissive: 0xffffff,
      emissiveIntensity: 0.45,
    }),
  };
  const lineMaterial = bend(new LineBasicMaterial({ color: 0x4f9be0 }), uniforms);
  // both sides write depth: back walls are dropped at bake time, the front faces must still cast
  const depthMaterial = bend(
    new MeshDepthMaterial({ depthPacking: RGBADepthPacking, side: DoubleSide }),
    uniforms,
  );

  // ---------------------------------------------------------------- lights & sky
  const hemi = new HemisphereLight(0xeef8ff, 0xf6ead0, 1.3);
  const sun = new DirectionalLight(0xfff1d8, 2);
  const fill = new DirectionalLight(0xe4f2ff, 0.8);
  const ambient = new AmbientLight(0xffffff, 0);
  sun.castShadow = true;
  const shadowSize = opts.shadowMapSize ?? 2048;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.04;
  scene.add(hemi, sun, sun.target, fill, ambient);
  const skyMat = new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { top: { value: new Color() }, bottom: { value: new Color() } },
    vertexShader:
      "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader:
      "uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float t = clamp(vP.y*2.6+0.02,0.0,1.0); gl_FragColor = linearToOutputTexel(vec4(mix(bottom, top, pow(t,0.8)),1.0)); }",
  });
  const sky = new Mesh(new SphereGeometry(800, 24, 12), skyMat);
  sky.frustumCulled = false;
  scene.add(sky);
  scene.fog = new Fog(0xd2f3ff, 200, 360);

  // ---------------------------------------------------------------- city state
  let built: BuiltCity | null = null;
  let cityObjects: Object3D[] = [];
  let currentViewKey = "";
  let hourOverride: number | null = opts.hour ?? null;
  let buildMs = 0;
  const cam: CameraState = { x: 0, z: 0, dist: CAMERA.defaultDist };
  const tapHandlers: ((t: TapTarget) => void)[] = [];

  // agents
  const agentTemplates = buildAgentTemplates();
  const instanced = new Map<string, InstancedMesh>();
  const makeInstanced = (key: keyof typeof agentTemplates, max: number) => {
    const im = new InstancedMesh(agentTemplates[key], materials.opaque, max);
    im.instanceMatrix.setUsage(DynamicDrawUsage);
    im.count = 0;
    im.frustumCulled = false;
    im.castShadow = false;
    im.receiveShadow = true;
    scene.add(im);
    instanced.set(key, im);
    return im;
  };
  makeInstanced("car", AGENT_MAX.car);
  makeInstanced("bus", AGENT_MAX.bus);
  makeInstanced("personA", AGENT_MAX.person / 3);
  makeInstanced("personB", AGENT_MAX.person / 3);
  makeInstanced("personC", AGENT_MAX.person / 3);
  makeInstanced("boat", AGENT_MAX.boat);
  for (const k of ["dog", "cat", "bunny", "duck"] as const) makeInstanced(k, AGENT_MAX.pet);
  const carColors = [0xff6f61, 0x5e93d6, 0xffd447, 0x6fcf5a, 0xb283e0, 0xffffff, 0xff9f43].map(
    (c) => new Color(c),
  );

  function viewKey(v: CityView) {
    return JSON.stringify(v);
  }

  function setView(view: CityView) {
    const key = viewKey(view);
    if (key === currentViewKey) return;
    currentViewKey = key;
    const t0 = performance.now();
    for (const o of cityObjects) {
      scene.remove(o);
      if (o instanceof Mesh || o instanceof LineSegments) o.geometry.dispose();
    }
    cityObjects = [];
    const atlas = new SignAtlas(canvasPainter(atlasCtx));
    built = buildCity(view, lib, atlas);
    atlasTexture.needsUpdate = true;
    for (const m of built.baked.meshes) {
      const mesh = new Mesh(m.geometry, materials[m.kind]);
      mesh.castShadow = m.kind === "opaque";
      mesh.receiveShadow = m.kind !== "cloud";
      if (mesh.castShadow) mesh.customDepthMaterial = depthMaterial;
      mesh.renderOrder = m.kind === "ghost" ? 2 : 0;
      mesh.matrixAutoUpdate = false;
      scene.add(mesh);
      cityObjects.push(mesh);
    }
    if (built.baked.lines) {
      const lines = new LineSegments(built.baked.lines, lineMaterial);
      lines.renderOrder = 3;
      lines.matrixAutoUpdate = false;
      scene.add(lines);
      cityObjects.push(lines);
    }
    uniforms.curveCenter.value.copy(built.center);
    uniforms.curveStart.value = built.composition.curveStart;
    const b = built.composition.layout.bounds;
    const span = Math.max(b.maxX - b.minX, b.maxZ - b.minZ) / 2 + 30;
    Object.assign(sun.shadow.camera, {
      left: -span,
      right: span,
      top: span,
      bottom: -span,
      near: 1,
      far: 400,
    });
    sun.shadow.camera.updateProjectionMatrix();
    Object.assign(cam, clampState(cam, built.composition.panBounds));
    buildMs = performance.now() - t0;
    applyLighting();
  }

  function applyLighting() {
    const now = new Date();
    const hour = hourOverride ?? now.getHours() + now.getMinutes() / 60;
    const L: Lighting = lightingAt(hour);
    skyMat.uniforms.top?.value.set(L.skyTop);
    skyMat.uniforms.bottom?.value.set(L.skyHorizon);
    (scene.fog as Fog).color.set(L.skyHorizon);
    hemi.color.set(L.hemiSky);
    hemi.groundColor.set(L.hemiGround);
    hemi.intensity = L.hemiIntensity;
    sun.color.set(L.sunColor);
    sun.intensity = L.sunIntensity;
    fill.intensity = L.fill;
    const c = built?.center;
    const cx = c?.x ?? 0;
    const cz = c?.y ?? 0;
    sun.position.set(cx + L.sunDir[0] * 2, L.sunDir[1] * 2, cz + L.sunDir[2] * 2);
    sun.target.position.set(cx, 0, cz);
    sun.target.updateMatrixWorld();
    fill.position.set(cx + 60, 28, cz + 4);
    const done = currentViewKey.includes('"townHallOrder":"done"');
    shared.uLights.value = Math.max(L.lights, done ? 0.7 : 0);
    shared.uWindow.value = L.windows;
    renderer.shadowMap.needsUpdate = true;
  }

  // ---------------------------------------------------------------- agents update
  let elapsed = 0;
  const m4 = new Matrix4();
  const q = new Quaternion();
  const up = new Vector3(0, 1, 0);
  const one = new Vector3(1, 1, 1);
  const pos = new Vector3();
  function updateAgents(dt: number) {
    elapsed += dt;
    if (!built) return;
    const plan = built.composition.agents;
    const place = (
      im: InstancedMesh,
      i: number,
      x: number,
      y: number,
      z: number,
      heading: number,
      color?: Color,
    ) => {
      q.setFromAxisAngle(up, heading);
      m4.compose(pos.set(x, y, z), q, one);
      im.setMatrixAt(i, m4);
      if (color) im.setColorAt(i, color);
    };
    const cars = instanced.get("car") as InstancedMesh;
    const buses = instanced.get("bus") as InstancedMesh;
    const nCars = Math.min(AGENT_MAX.car, plan.cars);
    const loops = plan.carLoops;
    let busCount = 0;
    for (let i = 0; i < nCars && loops.length; i++) {
      const loop = loops[(i * 7) % loops.length] as [number, number][];
      const len = pathLength(loop, true);
      const s = sampleAt(loop, true, elapsed * 5.5 + (i * len) / 2.7);
      if (i % 6 === 5 && busCount < AGENT_MAX.bus)
        place(buses, busCount++, s.x, 0.16, s.z, s.heading);
      else place(cars, i - busCount, s.x, 0.16, s.z, s.heading, carColors[i % carColors.length]);
    }
    cars.count = nCars - busCount;
    buses.count = busCount;
    const people = ["personA", "personB", "personC"].map((k) => instanced.get(k) as InstancedMesh);
    const counts = [0, 0, 0];
    const nPeople = Math.min(AGENT_MAX.person, plan.people);
    for (let i = 0; i < nPeople && plan.walkLoops.length; i++) {
      const loop = plan.walkLoops[(i * 5) % plan.walkLoops.length] as [number, number][];
      const len = pathLength(loop, true);
      const s = sampleAt(
        loop,
        true,
        elapsed * (0.9 + (i % 3) * 0.15) * (i % 2 ? 1 : -1) + (i * len) / 3.3,
      );
      const k = i % 3;
      const im = people[k] as InstancedMesh;
      place(
        im,
        counts[k] as number,
        s.x,
        0.12,
        s.z,
        s.heading + Math.PI / 2 + (i % 2 ? 0 : Math.PI),
      );
      counts[k] = (counts[k] as number) + 1;
    }
    people.forEach((im, k) => {
      im.count = counts[k] as number;
    });
    const boats = instanced.get("boat") as InstancedMesh;
    const nBoats = Math.min(AGENT_MAX.boat, plan.boats);
    for (let i = 0; i < nBoats; i++) {
      const line = plan.boatLines[i % plan.boatLines.length] as [number, number][];
      const s = sampleAt(line, false, elapsed * 2.2 + i * 9);
      place(boats, i, s.x, 0.12 + Math.sin(elapsed * 2 + i) * 0.05, s.z, s.heading);
    }
    boats.count = nBoats;
    const petCounts: Record<string, number> = { dog: 0, cat: 0, bunny: 0, duck: 0 };
    plan.pets.forEach((p, i) => {
      const code = p.code in petCounts ? p.code : "dog";
      const im = instanced.get(code) as InstancedMesh;
      const a = elapsed * 0.6 + i * 2.1;
      const idx = petCounts[code] as number;
      place(im, idx, p.x + Math.cos(a) * 2.2, 0.12, p.z + Math.sin(a) * 1.2, -a - Math.PI / 2);
      petCounts[code] = idx + 1;
    });
    for (const k of Object.keys(petCounts))
      (instanced.get(k) as InstancedMesh).count = petCounts[k] as number;
    for (const im of instanced.values()) {
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
    }
  }

  // ---------------------------------------------------------------- camera input
  let flight: {
    from: CameraState;
    to: CameraState;
    t0: number;
    ms: number;
    done: () => void;
  } | null = null;
  const pointers = new Map<number, { x: number; y: number }>();
  let downAt = { x: 0, y: 0, t: 0 };
  let pinchDist = 0;
  const onDown = (e: PointerEvent) => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()] as [{ x: number; y: number }, { x: number; y: number }];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
    }
    flight = null;
  };
  const onMove = (e: PointerEvent) => {
    const prev = pointers.get(e.pointerId);
    if (!prev || !built) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.set(e.pointerId, cur);
    if (pointers.size === 1) {
      const d = panDelta(cam, cur.x - prev.x, cur.y - prev.y, canvas.clientHeight || 1);
      Object.assign(
        cam,
        clampState({ ...cam, x: cam.x + d.x, z: cam.z + d.z }, built.composition.panBounds),
      );
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()] as [{ x: number; y: number }, { x: number; y: number }];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist > 0)
        Object.assign(
          cam,
          clampState({ ...cam, dist: (cam.dist * pinchDist) / dist }, built.composition.panBounds),
        );
      pinchDist = dist;
    }
  };
  const onUp = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    if (pointers.size === 0 && moved < 10 && performance.now() - downAt.t < 400) {
      const target = pick(e.clientX, e.clientY);
      if (target) for (const fn of tapHandlers) fn(target);
    }
  };
  const onWheel = (e: WheelEvent) => {
    if (!built) return;
    e.preventDefault();
    Object.assign(
      cam,
      clampState(
        { ...cam, dist: cam.dist * (1 + Math.sign(e.deltaY) * 0.08) },
        built.composition.panBounds,
      ),
    );
  };
  canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  // ---------------------------------------------------------------- picking & anchors
  const project = (x: number, y: number, z: number) => {
    const v = new Vector3(x, y, z).project(camera);
    const rect = canvas.getBoundingClientRect();
    return {
      x: rect.left + ((v.x + 1) / 2) * rect.width,
      y: rect.top + ((1 - v.y) / 2) * rect.height,
      visible: v.z < 1 && Math.abs(v.x) <= 1.05 && Math.abs(v.y) <= 1.05,
    };
  };

  function pick(clientX: number, clientY: number): TapTarget | null {
    if (!built) return null;
    const { layout } = built.composition;
    let best: { target: TapTarget; depth: number } | null = null;
    const consider = (target: TapTarget, x: number, z: number, w: number, d: number, h: number) => {
      let minX = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;
      for (const sx of [-1, 1])
        for (const sz of [-1, 1])
          for (const y of [0, h]) {
            const p = project(x + (sx * w) / 2, y, z + (sz * d) / 2);
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
          }
      if (clientX < minX || clientX > maxX || clientY < minY || clientY > maxY) return;
      const depth = camera.position.distanceTo(new Vector3(x, 0, z));
      if (!best || depth < best.depth) best = { target, depth };
    };
    for (const lot of layout.lots) {
      const c = lot.content;
      const anchorsForLot = built.baked.anchors;
      if (c.type === "skill") {
        const s = currentSkills()[c.skill];
        if (!s) continue;
        const a = anchorsForLot.get(`skill:${s.skillId}`);
        consider(
          { type: "skill", skillId: s.skillId },
          lot.x,
          lot.z,
          lot.width * 0.8,
          lot.depth * 0.8,
          a ? a.y - 1 : 4,
        );
      } else if (c.type === "public") {
        const code = currentPublics()[c.publicIndex];
        if (code) consider({ type: "public", code }, lot.x, lot.z, lot.width, lot.depth, 4);
      } else if (c.type === "plot") {
        consider({ type: "plot", plot: c.plot }, lot.x, lot.z, lot.width, lot.depth, 2.5);
      }
    }
    consider({ type: "townHall" }, 0, -1.6, 8, 8, 9);
    consider({ type: "wonder" }, layout.wonder.x, layout.wonder.z, 12, 12, 10);
    return (best as { target: TapTarget } | null)?.target ?? null;
  }

  let parsedView: CityView | null = null;
  const currentView = () => {
    if (!parsedView || JSON.stringify(parsedView) !== currentViewKey)
      parsedView = currentViewKey ? (JSON.parse(currentViewKey) as CityView) : null;
    return parsedView;
  };
  const currentSkills = () => currentView()?.skills ?? [];
  const currentPublics = () => currentView()?.publicBuildings ?? [];

  function anchors(ids?: string[]): ScreenAnchor[] {
    if (!built) return [];
    const out: ScreenAnchor[] = [];
    for (const [id, p] of built.baked.anchors) {
      if (ids && !ids.includes(id)) continue;
      const s = project(p.x, p.y, p.z);
      out.push({ id, x: s.x, y: s.y, visible: s.visible });
    }
    return out;
  }

  // ---------------------------------------------------------------- loop
  let raf = 0;
  let last = performance.now();
  let frames = 0;
  let acc = 0;
  let fps = 0;
  let frameMs = 0;
  let slowWindows = 0;
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    tick(dt, now);
    frames++;
    acc += dt;
    if (acc >= 1) {
      fps = frames / acc;
      frameMs = (acc / frames) * 1000;
      // adaptive resolution: step down if we keep missing 50 fps, never below 1×
      if (fps < 50 && dpr > 1) {
        slowWindows++;
        if (slowWindows >= 2) {
          dpr = Math.max(1, dpr - 0.25);
          renderer.setPixelRatio(dpr);
          resize();
          slowWindows = 0;
        }
      } else slowWindows = 0;
      frames = 0;
      acc = 0;
      if (hourOverride === null) applyLighting();
    }
  };
  function tick(dt: number, now: number) {
    if (flight) {
      const t = Math.min(1, (now - flight.t0) / flight.ms);
      const e = easeInOut(t);
      cam.x = flight.from.x + (flight.to.x - flight.from.x) * e;
      cam.z = flight.from.z + (flight.to.z - flight.from.z) * e;
      cam.dist = flight.from.dist + (flight.to.dist - flight.from.dist) * e;
      if (t >= 1) {
        const done = flight.done;
        flight = null;
        done();
      }
    }
    updateAgents(dt);
    applyCamera(camera, cam, (canvas.clientWidth || 1) / (canvas.clientHeight || 1));
    renderer.render(scene, camera);
  }
  function resize() {
    const w = canvas.clientWidth || canvas.width;
    const h = canvas.clientHeight || canvas.height;
    renderer.setSize(w, h, false);
  }
  const onVisibility = () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (!opts.manualLoop) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };
  document.addEventListener("visibilitychange", onVisibility);
  resize();
  if (!opts.manualLoop) raf = requestAnimationFrame(frame);

  const api: CityEngine = {
    setView,
    setHour(h) {
      hourOverride = h;
      applyLighting();
    },
    resize,
    on(_event, fn) {
      tapHandlers.push(fn);
    },
    anchors,
    flyTo(x, z, dist = cam.dist, ms = 900) {
      return new Promise((resolve) => {
        const to = built ? clampState({ x, z, dist }, built.composition.panBounds) : { x, z, dist };
        flight = { from: { ...cam }, to, t0: performance.now(), ms, done: resolve };
        if (opts.manualLoop) {
          Object.assign(cam, to);
          flight = null;
          resolve();
        }
      });
    },
    async focus(target, ms) {
      const lot = api.lotOf(target);
      if (!lot) return;
      await api.flyTo(lot.x, lot.z, CAMERA.minDist + 14, ms);
    },
    home() {
      if (!built) return { ...cam };
      const b = built.composition.layout.bounds;
      const extent = Math.max(b.maxX - b.minX, b.maxZ - b.minZ);
      return clampState(
        {
          x: (b.minX + b.maxX) / 2,
          z: (b.minZ + b.maxZ) / 2,
          dist: Math.min(CAMERA.defaultDist, Math.max(62, extent * 1.2)),
        },
        built.composition.panBounds,
      );
    },
    async tour(ms = 6000) {
      if (!built) return;
      const b = built.composition.panBounds;
      const home = api.home();
      const dist = Math.min(CAMERA.maxDist, home.dist + 16);
      const stops: [number, number][] = [
        [b.maxX, b.maxZ],
        [b.maxX, b.minZ],
        [b.minX, b.minZ],
        [b.minX, b.maxZ],
      ];
      const leg = ms / (stops.length + 1);
      for (const [x, z] of stops) await api.flyTo(x, z, dist, leg);
      await api.flyTo(home.x, home.z, home.dist, leg);
    },
    lotOf(target) {
      if (!built) return null;
      const { layout } = built.composition;
      const view = currentView();
      if (target.type === "wonder") return { ...layout.wonder, width: 15, depth: 15 };
      if (target.type === "townHall") return { x: 0, z: -1.6, width: 9, depth: 9 };
      const lot = layout.lots.find((l) => {
        const c = l.content;
        if (target.type === "skill")
          return c.type === "skill" && view?.skills[c.skill]?.skillId === target.skillId;
        if (target.type === "plot") return c.type === "plot" && c.plot === target.plot;
        return c.type === "public" && view?.publicBuildings[c.publicIndex] === target.code;
      });
      return lot ? { x: lot.x, z: lot.z, width: lot.width, depth: lot.depth } : null;
    },
    hold(target) {
      const lot = api.lotOf(target);
      if (!lot) return;
      uniforms.riseCenter.value.set(lot.x, lot.z);
      uniforms.riseHalf.value.set(lot.width / 2 + 0.6, lot.depth / 2 + 0.6);
      uniforms.riseProgress.value = 0;
      renderer.shadowMap.needsUpdate = true;
    },
    rise(target, ms = 2000) {
      const lot = api.lotOf(target);
      if (!lot) return Promise.resolve();
      api.hold(target);
      const start = performance.now();
      return new Promise((resolve) => {
        const step = () => {
          const t = Math.min(1, (performance.now() - start) / ms);
          // grow, overshoot a little, settle — a spring, not a slide
          const grow = 1 - (1 - t) ** 3;
          const wobble = Math.sin(t * Math.PI * 2.5) * (1 - t) * 0.12;
          uniforms.riseProgress.value = Math.max(0, grow + wobble * t);
          renderer.shadowMap.needsUpdate = true;
          if (opts.manualLoop) api.renderOnce();
          if (t < 1) requestAnimationFrame(step);
          else {
            uniforms.riseProgress.value = 1;
            uniforms.riseHalf.value.set(0, 0);
            renderer.shadowMap.needsUpdate = true;
            resolve();
          }
        };
        requestAnimationFrame(step);
      });
    },
    snapshot(quality = 0.72) {
      api.renderOnce();
      return canvas.toDataURL("image/jpeg", quality);
    },
    pause(paused) {
      if (paused) cancelAnimationFrame(raf);
      else if (!opts.manualLoop) {
        cancelAnimationFrame(raf);
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    },
    camera: () => ({ ...cam }),
    setCamera(s) {
      Object.assign(
        cam,
        built ? clampState({ ...cam, ...s }, built.composition.panBounds) : { ...cam, ...s },
      );
    },
    renderOnce() {
      updateAgents(0);
      applyCamera(camera, cam, (canvas.clientWidth || 1) / (canvas.clientHeight || 1));
      renderer.render(scene, camera);
    },
    stats: () => ({
      fps,
      frameMs,
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      pixelRatio: dpr,
      buildMs,
    }),
    dispose() {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
      for (const o of cityObjects)
        if (o instanceof Mesh || o instanceof LineSegments) o.geometry.dispose();
      for (const m of Object.values(materials)) m.dispose();
      atlasTexture.dispose();
      renderer.dispose();
    },
  };
  return api;
}
