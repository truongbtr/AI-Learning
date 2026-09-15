// City bench: renders a sample city with the real engine, shows fps / draw calls / triangles and
// HTML mission bubbles. Used for screenshots (shoot-bench) and on the real iPad (published page).
import { KenneyLibrary } from "../src/build/kenney";
import { createCityEngine, type TapTarget } from "../src/engine";
import { CITY_IDS, type CityId } from "../src/palette";
import { type SampleSize, sampleView } from "../src/sample";

declare global {
  interface Window {
    __ready?: boolean;
    __bench?: unknown;
  }
}

const q = new URLSearchParams(location.search);
const meta = (name: string) =>
  document.querySelector<HTMLMetaElement>(`meta[name=${name}]`)?.content;
let city = ((q.get("city") || meta("city-default")) as CityId) || "vmath";
let size = ((q.get("size") || meta("size-default")) as SampleSize) || "mid";
const hourParam = q.get("hour");
const assets =
  q.get("assets") ||
  document.querySelector<HTMLMetaElement>("meta[name=city-assets]")?.content ||
  "../../../content/art/city";
const shot = q.has("shot");

async function main() {
  const canvas = document.getElementById("city") as HTMLCanvasElement;
  const hud = document.getElementById("hud") as HTMLDivElement;
  const controls = document.getElementById("controls") as HTMLDivElement;
  if (shot) {
    hud.classList.add("hide");
    controls.classList.add("hide");
  }
  // Published pages cannot serve raw binary: there the blob ships as base64 JSON (meta city-bin=b64).
  const lib =
    meta("city-bin") === "b64"
      ? await KenneyLibrary.load(assets, async (input) => {
          const url = String(input);
          if (!url.endsWith("kenney.bin")) return fetch(input);
          const { data } = (await (await fetch(`${url}.json`)).json()) as { data: string };
          const bytes = Uint8Array.from(atob(data), (ch) => ch.charCodeAt(0));
          return new Response(bytes.buffer);
        })
      : undefined;
  const engine = await createCityEngine(canvas, {
    ...(lib ? { lib } : {}),
    assetsBase: assets,
    hour: hourParam !== null ? Number(hourParam) : undefined,
    manualLoop: shot,
    maxPixelRatio: Number(q.get("dpr") || 2),
  });
  const load = () => {
    engine.setView(sampleView(city, size));
    const cx = q.get("cx");
    const cz = q.get("cz");
    const cd = q.get("cd");
    engine.setCamera({
      ...(cx !== null ? { x: Number(cx) } : {}),
      ...(cz !== null ? { z: Number(cz) } : {}),
      ...(cd !== null ? { dist: Number(cd) } : {}),
    });
  };
  load();

  const bubbles = new Map<string, HTMLButtonElement>();
  const syncBubbles = () => {
    if (q.has("nobubbles")) return;
    const view = sampleView(city, size);
    const wanted = new Set<string>(["townHall:order", "wonder"]);
    for (const s of view.skills)
      if (s.mission || s.needsHelp || s.level === 0) wanted.add(`skill:${s.skillId}`);
    wanted.add(`plot:${view.land.owned}`);
    for (const a of engine.anchors([...wanted])) {
      let el = bubbles.get(a.id);
      if (!el) {
        el = document.createElement("button");
        el.className = "bubble";
        el.setAttribute("aria-label", a.id);
        el.textContent = a.id.startsWith("townHall")
          ? "📜"
          : a.id === "wonder"
            ? "🏛️"
            : a.id.startsWith("plot")
              ? "★"
              : "★";
        const skill = view.skills.find((s) => `skill:${s.skillId}` === a.id);
        if (skill?.needsHelp) el.classList.add("help");
        document.body.appendChild(el);
        bubbles.set(a.id, el);
      }
      el.hidden = !a.visible;
      el.style.left = `${a.x}px`;
      el.style.top = `${a.y}px`;
    }
    for (const [id, el] of bubbles)
      if (!wanted.has(id)) {
        el.remove();
        bubbles.delete(id);
      }
  };

  engine.on("tap", (t: TapTarget) => {
    hud.dataset.tap = JSON.stringify(t);
    void engine.focus(t);
  });

  if (!shot) {
    const sel = document.createElement("select");
    for (const id of CITY_IDS) sel.append(new Option(id, id, id === city, id === city));
    sel.onchange = () => {
      city = sel.value as CityId;
      load();
    };
    const sizeSel = document.createElement("select");
    for (const s of ["day1", "mid", "full"])
      sizeSel.append(new Option(s, s, s === size, s === size));
    sizeSel.onchange = () => {
      size = sizeSel.value as SampleSize;
      load();
    };
    const hours = document.createElement("select");
    for (const h of ["real", "9", "17.5", "18.7", "21"])
      hours.append(new Option(h === "real" ? "giờ thật" : `${h}h`, h));
    hours.onchange = () => engine.setHour(hours.value === "real" ? null : Number(hours.value));
    const measure = document.createElement("button");
    measure.textContent = "Đo 20 giây";
    measure.onclick = () => void runMeasure(measure);
    controls.append(sel, sizeSel, hours, measure);
  }

  // 20 s: the camera sweeps across the city (the heaviest thing a kid does), frame times recorded
  async function runMeasure(button: HTMLButtonElement) {
    button.disabled = true;
    const result = document.getElementById("result") as HTMLDivElement;
    result.hidden = false;
    result.textContent = "Đang đo… để yên máy 20 giây";
    const start = engine.camera();
    const times: number[] = [];
    let last = performance.now();
    const t0 = last;
    await new Promise<void>((done) => {
      const step = (now: number) => {
        times.push(now - last);
        last = now;
        const t = (now - t0) / 20000;
        const a = t * Math.PI * 2;
        engine.setCamera({
          x: start.x + Math.cos(a) * 40,
          z: start.z + Math.sin(a) * 30,
          dist: 90 + Math.sin(a * 2) * 30,
        });
        if (t < 1) requestAnimationFrame(step);
        else done();
      };
      requestAnimationFrame(step);
    });
    engine.setCamera(start);
    const frames = times.slice(10).sort((x, y) => x - y);
    const avg = frames.reduce((x, y) => x + y, 0) / frames.length;
    const p95 = frames[Math.floor(frames.length * 0.95)] ?? avg;
    const st = engine.stats();
    const text = `${city} · ${size}
Trung bình ${(1000 / avg).toFixed(0)} fps · 5% chậm nhất ${(1000 / p95).toFixed(0)} fps
Khung chậm nhất ${(frames[frames.length - 1] ?? 0).toFixed(0)} ms · DPR ${st.pixelRatio} · ${st.drawCalls} draw calls · ${st.triangles} tam giác
Màn hình ${screen.width}×${screen.height} @${devicePixelRatio} · dựng ${st.buildMs.toFixed(0)} ms`;
    result.textContent = text;
    button.disabled = false;
  }

  const tickHud = () => {
    const s = engine.stats();
    const c = engine.camera();
    hud.textContent = `${city} · ${size}\nfps ${s.fps.toFixed(0)}  (${s.frameMs.toFixed(1)} ms)\ndraw calls ${s.drawCalls}\ntriangles ${s.triangles}\ndpr ${s.pixelRatio}  build ${s.buildMs.toFixed(0)} ms\ncam ${c.x.toFixed(0)},${c.z.toFixed(0)} d${c.dist.toFixed(0)}${hud.dataset.tap ? `\ntap ${hud.dataset.tap}` : ""}`;
    syncBubbles();
    window.__bench = { ...s, camera: c };
  };
  if (shot) {
    engine.renderOnce();
    syncBubbles();
    window.__bench = { ...engine.stats(), camera: engine.camera() };
    window.__ready = true;
  } else {
    setInterval(tickHud, 250);
    requestAnimationFrame(() => {
      window.__ready = true;
    });
  }
  window.addEventListener("resize", () => engine.resize());
}

main().catch((err) => {
  document.body.insertAdjacentHTML(
    "beforeend",
    `<pre style="position:fixed;left:12px;bottom:12px;background:#fff;padding:12px;border-radius:12px;color:#1f3b63">${String(err?.stack || err)}</pre>`,
  );
  console.error(err);
});
