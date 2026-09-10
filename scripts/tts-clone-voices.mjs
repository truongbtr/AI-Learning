// Clones the family's two child voices on ElevenLabs (Instant Voice Cloning) from the recordings
// in "ai voice/" and writes the voice ids into .env (TTS_VOICE_BOY / TTS_VOICE_GIRL).
//
//   node scripts/tts-clone-voices.mjs            # needs TTS_PROVIDER=elevenlabs + TTS_API_KEY in .env
//   node scripts/tts-clone-voices.mjs --list     # show voices already on the account
//
// Instant cloning needs no training run: 30–60 s of clean speech is enough. The recordings stay on
// this machine (folder is git-ignored); only the audio is uploaded once to create the voice.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env");
const env = Object.fromEntries(
  (await readFile(envPath, "utf8"))
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const apiKey = process.env.TTS_API_KEY ?? env.TTS_API_KEY;
if (!apiKey) {
  console.error("TTS_API_KEY is empty. Put your ElevenLabs API key in .env first.");
  process.exit(1);
}
const headers = { "xi-api-key": apiKey };

if (process.argv.includes("--list")) {
  const res = await fetch("https://api.elevenlabs.io/v1/voices", { headers });
  const body = await res.json();
  for (const v of body.voices ?? []) console.log(`${v.voice_id}\t${v.category}\t${v.name}`);
  process.exit(0);
}

const SAMPLES = [
  {
    key: "TTS_VOICE_GIRL",
    name: "MTCT bé gái",
    file: "Giọng bé gái.mp3",
    labels: { gender: "female", age: "child", accent: "vietnamese-north" },
  },
  {
    key: "TTS_VOICE_BOY",
    name: "MTCT bé trai",
    file: "Giọng bé trai.mp3",
    labels: { gender: "male", age: "child", accent: "vietnamese-north" },
  },
];

let envText = await readFile(envPath, "utf8");
for (const s of SAMPLES) {
  if (env[s.key]) {
    console.log(`${s.key} already set (${env[s.key]}), skipping ${s.file}`);
    continue;
  }
  const audio = await readFile(path.join(root, "ai voice", s.file));
  const form = new FormData();
  form.set("name", s.name);
  form.set("description", "Giọng trẻ em miền Bắc cho app Học cùng Mai Thy & Chí Thanh");
  form.set("labels", JSON.stringify(s.labels));
  form.set("remove_background_noise", "true");
  form.append("files", new Blob([audio], { type: "audio/mpeg" }), s.file);
  const res = await fetch("https://api.elevenlabs.io/v1/voices/add", {
    method: "POST",
    headers,
    body: form,
  });
  if (!res.ok) {
    console.error(`Cloning ${s.file} failed: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  const { voice_id: voiceId } = await res.json();
  console.log(`${s.file} → ${s.key}=${voiceId}`);
  envText = envText.match(new RegExp(`^${s.key}=.*$`, "m"))
    ? envText.replace(new RegExp(`^${s.key}=.*$`, "m"), `${s.key}=${voiceId}`)
    : `${envText.trimEnd()}\n${s.key}=${voiceId}\n`;
}
await writeFile(envPath, envText);
console.log("Done. Restart the web app so it picks up the new voice ids.");
