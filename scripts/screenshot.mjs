#!/usr/bin/env node
// Render ad.png: a genuine headless-Chromium screenshot of index.html at the
// configured size (default 1280x800, 1x, light theme), taken after the page's
// entrance animation has settled.
//
//   node scripts/screenshot.mjs
//
// Chromium is found via $CHROME_PATH, then the usual names on PATH.

import { existsSync, readFileSync, rmSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG = JSON.parse(readFileSync(join(ROOT, "makefun.config.json"), "utf8"));
const PAGE = join(ROOT, "index.html");
const OUT = join(ROOT, "ad.png");
const W = CONFIG.viewport?.width ?? 1280;
const H = CONFIG.viewport?.height ?? 800;

function findChromium() {
  const candidates = [
    process.env.CHROME_PATH,
    "chromium",
    "chromium-browser",
    "google-chrome",
    "google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome",
  ].filter(Boolean);
  for (const c of candidates) {
    const probe = spawnSync(c, ["--version"], { encoding: "utf8" });
    if (probe.status === 0) return c;
  }
  return null;
}

function pngSize(buf) {
  if (buf.length < 24 || buf.toString("latin1", 1, 4) !== "PNG") return null;
  if (buf.toString("latin1", 12, 16) !== "IHDR") return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

const bin = findChromium();
if (!bin) {
  console.error("screenshot: no Chromium found. Install one or set $CHROME_PATH.");
  process.exit(1);
}

if (existsSync(OUT)) rmSync(OUT);

const args = [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--hide-scrollbars",
  "--force-device-scale-factor=1",
  "--force-color-profile=srgb",
  "--window-size=" + W + "," + H,
  "--virtual-time-budget=4000",
  "--screenshot=" + OUT,
  pathToFileURL(PAGE).href,
];

const run = spawnSync(bin, args, { encoding: "utf8" });
if (run.status !== 0 && !existsSync(OUT)) {
  console.error("screenshot: Chromium failed.");
  if (run.stderr) console.error(run.stderr.trim());
  process.exit(1);
}

if (!existsSync(OUT)) {
  console.error("screenshot: Chromium exited without writing ad.png.");
  process.exit(1);
}

const buf = readFileSync(OUT);
const size = pngSize(buf);
if (!size) {
  console.error("screenshot: ad.png is not a valid PNG.");
  process.exit(1);
}
if (size.width !== W || size.height !== H) {
  console.error(`screenshot: ad.png is ${size.width}x${size.height}, expected ${W}x${H}.`);
  process.exit(1);
}

const kb = (statSync(OUT).size / 1024).toFixed(1);
console.log(`screenshot: wrote ad.png (${size.width}x${size.height}, ${kb} KB) from index.html using ${bin}.`);
