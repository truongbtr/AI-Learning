// @mtct/city — the 3D subject cities of the kid UI (Pha 10). Browser engine: "@mtct/city/engine".
export { type BakedMesh, type BakeResult, bake } from "./build/bake";
export { DECORATIONS, PLOT_CATALOGUE, PUBLIC_BUILDINGS } from "./build/civic";
export { KenneyLibrary } from "./build/kenney";
export { SignAtlas } from "./build/signs";
export { WONDER_PIECES } from "./build/wonders";
export * from "./color";
export { IPAD_BUDGET, visibleBudget } from "./engine/budget";
export { CAMERA, type CameraState, clampState } from "./engine/camera";
export { type Lighting, lightingAt } from "./engine/daynight";
export {
  agentSample,
  seedOf,
  spawnTraffic,
  stepTraffic,
  type TrafficState,
} from "./engine/traffic";
export * from "./home-plan";
export * from "./layout";
export * from "./layout-plan";
export * from "./palette";
export * from "./paper-map";
export { type BuiltCity, buildCity, CHUNK_SIZE } from "./scene/build-city";
export { composeCity, polygon, ribbon } from "./scene/compose";
export * from "./waterways";
