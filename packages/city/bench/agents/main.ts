// Agent showcase: every moving thing, turned to four headings, lit plainly — to look at the models
// themselves without the city around them.  pnpm --filter @mtct/city exec tsx scripts/shoot-agents.ts
import {
  AmbientLight,
  Color,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  WebGLRenderer,
} from "three";
import { buildAgentTemplates } from "../../src/engine/agents";

declare global {
  interface Window {
    __ready?: boolean;
  }
}

const canvas = document.getElementById("c") as HTMLCanvasElement;
const renderer = new WebGLRenderer({ canvas, antialias: true });
renderer.setSize(canvas.width, canvas.height, false);
const scene = new Scene();
scene.background = new Color(0xd2f3ff);
scene.add(new AmbientLight(0xffffff, 0.9));
const sun = new DirectionalLight(0xffffff, 1.6);
sun.position.set(-6, 10, 8);
scene.add(sun);
const ground = new Mesh(new PlaneGeometry(60, 30), new MeshStandardMaterial({ color: 0x8fd16a }));
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const material = new MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
const templates = buildAgentTemplates();
const keys = ["car", "bus", "personA", "boat", "dog"] as const;
keys.forEach((key, row) => {
  for (let col = 0; col < 4; col++) {
    const m = new Mesh(templates[key], material);
    m.position.set(-12 + col * 7, 0, -10 + row * 5);
    m.rotation.y = (col * Math.PI) / 2;
    scene.add(m);
  }
});

// the city camera's angle (engine/camera.ts), orthographic so every model is the same size
const camera = new OrthographicCamera(-16, 16, 11, -11, 0.1, 200);
camera.position.set(12, 30, 40);
camera.lookAt(-1.5, 0, 0);
renderer.render(scene, camera);
window.__ready = true;
