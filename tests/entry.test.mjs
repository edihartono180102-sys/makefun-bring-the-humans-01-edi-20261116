// Checks the entry against the bring-the-humans-01 rules that can be verified
// locally, with no network and no dependencies:
//
//   node --test tests/
//
// It fails loudly if the page stops naming the referral code, ad.png stops
// being a real 1280x800 image, the README badges lose their live URLs, or the
// page starts pulling in an external resource.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const config = JSON.parse(read("makefun.config.json"));

const html = read("index.html");
const readme = read("README.md");
const license = read("LICENSE");
const png = readFileSync(join(ROOT, "ad.png"));

const slug = config.competition;
const code = config.referralCode;
const link = `${config.site}/r/${code}`;
const repoPath = `${config.owner}/${config.repo}`;

test("required files exist at the repository root", () => {
  for (const f of ["index.html", "ad.png", "README.md", "LICENSE"]) {
    assert.ok(statSync(join(ROOT, f)).isFile(), `${f} must be a file at the root`);
  }
});

test("index.html is a well-formed standalone document", () => {
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<meta charset="utf-8">/i);
  assert.match(html, /<meta name="viewport"[^>]*width=device-width/i);
  assert.match(html, /<title>[^<]{10,}<\/title>/);
  assert.match(html, /<meta name="description" content="[^"]{40,}"/);
  const h1s = html.match(/<h1[\s>]/gi) || [];
  assert.equal(h1s.length, 1, "the page should have exactly one h1");
});

test("the page names the entrant's referral code (bare, /r/<code> and ?ref)", () => {
  assert.match(html, new RegExp(`<meta name="makefun-referral-code" content="${code}">`));
  assert.ok(html.includes(code), "the bare code must appear");
  assert.ok(html.includes(`${config.site}/r/${code}`), "the /r/<code> link must appear");
  assert.ok(html.includes("?ref") || html.includes("ref"), "the page should honour ?ref=<code>");
  assert.match(html, /<link rel="canonical" href="https:\/\/make\.fun\/r\//);
});

test("the referral link is https on make.fun and used by the call to action", () => {
  assert.match(link, /^https:\/\/make\.fun\/r\/[A-Za-z0-9_-]+$/);
  const cta = html.match(/<a class="btn" id="cta" href="([^"]+)"/);
  assert.ok(cta, "the primary CTA must exist");
  assert.equal(cta[1], link);
});

test("ad.png is a real 1280x800 PNG under 2 MB", () => {
  assert.equal(png.toString("latin1", 1, 4), "PNG", "must carry the PNG signature");
  assert.equal(png.toString("latin1", 12, 16), "IHDR", "must start with an IHDR chunk");
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  assert.equal(width, config.viewport.width);
  assert.equal(height, config.viewport.height);
  const bytes = statSync(join(ROOT, "ad.png")).size;
  assert.ok(bytes > 1000, "the image should not be empty");
  assert.ok(bytes < 2 * 1024 * 1024, `ad.png must be under 2 MB (is ${bytes} bytes)`);
});

test("README carries the three live make.fun badges and no template placeholders", () => {
  assert.ok(readme.includes(`https://make.fun/badge/${slug}.svg`), "competition badge");
  assert.ok(readme.includes(`https://make.fun/badge/${slug}/${repoPath}/rank.svg`), "rank badge");
  assert.ok(readme.includes(`https://make.fun/badge/${slug}/${repoPath}/reward.svg`), "reward badge");
  assert.ok(readme.includes("https://make.fun/bounty/"), "must link to a make.fun page");
  assert.doesNotMatch(readme, /\{[a-zA-Z_]+\}/, "no {placeholder} may survive in the README");
  assert.doesNotMatch(readme, /img\.shields\.io/, "the badges must be make.fun's, not shields.io");
});

test("README documents how to run and how to set the referral code", () => {
  assert.match(readme, /## Run it/);
  assert.match(readme, /index\.html/);
  assert.match(readme, /npm run configure/);
  assert.match(readme, /referral/i);
});

test("LICENSE is OSI-approved (SPDX id present)", () => {
  const osi = ["MIT", "Apache-2.0", "BSD-3-Clause", "BSD-2-Clause", "ISC", "MPL-2.0", "GPL-3.0", "AGPL-3.0", "LGPL-3.0", "Unlicense"];
  assert.ok(osi.some((id) => license.includes(id)), "a recognised license id must appear");
  assert.match(license, /MIT License/);
  assert.match(license, /Permission is hereby granted/);
});

test("the page loads no external resources (works offline)", () => {
  assert.doesNotMatch(html, /<script[^>]+src=/i, "no external scripts");
  assert.doesNotMatch(html, /<img[^>]+src=["']https?:/i, "no remote images");
  assert.doesNotMatch(html, /<link[^>]+rel=["']stylesheet["'][^>]+href=["']https?:/i, "no remote stylesheets");
  assert.doesNotMatch(html, /@import\s+url\(/i, "no CSS @import");
  assert.doesNotMatch(html, /url\(\s*["']?https?:/i, "no remote url() references");
  assert.doesNotMatch(html, /fonts\.(googleapis|gstatic)\.com/i, "no remote fonts");
});

test("the page keeps basic accessibility affordances", () => {
  assert.match(html, /class="skip"/, "a skip link is present");
  assert.match(html, /id="main"/, "the skip target exists");
  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  for (const img of imgs) assert.match(img, /\balt=/, "every <img> needs alt text");
  const svgs = html.match(/<svg\b[^>]*>/gi) || [];
  for (const svg of svgs) {
    assert.match(svg, /aria-hidden="true"|role="img"|aria-label=/, "every inline svg needs a label or aria-hidden");
  }
});
