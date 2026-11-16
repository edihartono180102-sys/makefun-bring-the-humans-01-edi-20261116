#!/usr/bin/env node
// Point the entry at your own referral code / repository without editing files by hand.
//
//   node scripts/configure.mjs --code <your-code>
//   node scripts/configure.mjs --owner <gh-owner> --repo <repo-name>
//
// It rewrites index.html (meta tag, canonical/OG URLs, the visible pass and both
// links), README.md (the rank/reward badge URLs) and makefun.config.json, then
// reminds you to re-render ad.png.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const DEFAULT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const CODE_RE = /^[A-Za-z0-9_-]{2,32}$/;

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a.startsWith("--")) out[a.slice(2)] = argv[++i];
  }
  return out;
}

function replaceAll(haystack, needle, replacement) {
  if (!needle) return haystack;
  return haystack.split(needle).join(replacement);
}

function fail(msg) {
  console.error("configure: " + msg);
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
if (args.help || (!args.code && !args.owner && !args.repo)) {
  console.log(`usage:
  node scripts/configure.mjs --code <referral-code>
  node scripts/configure.mjs --owner <gh-owner> --repo <repo-name>

Options:
  --code   your referral code from make.fun -> Referrals (2-32 chars: A-Z a-z 0-9 _ -)
  --owner  GitHub account that owns the repository (updates the README badges)
  --repo   repository name (updates the README badges)
  --root   the repository to edit (default: the repository this script lives in)`);
  process.exit(args.help ? 0 : 1);
}

const ROOT = args.root ? resolve(String(args.root)) : DEFAULT_ROOT;
const CONFIG_PATH = join(ROOT, "makefun.config.json");
const INDEX_PATH = join(ROOT, "index.html");
const README_PATH = join(ROOT, "README.md");

const config = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
const changes = [];

if (args.code) {
  const next = String(args.code).trim();
  if (!CODE_RE.test(next)) fail(`"${next}" is not a valid referral code (2-32 chars: A-Z a-z 0-9 _ -).`);
  const prev = config.referralCode;
  if (prev !== next) {
    const html = replaceAll(readFileSync(INDEX_PATH, "utf8"), prev, next);
    writeFileSync(INDEX_PATH, html);
    config.referralCode = next;
    changes.push(`index.html + makefun.config.json: referral code ${prev} -> ${next}`);
  }
}

if (args.owner || args.repo) {
  const prevOwner = config.owner;
  const prevRepo = config.repo;
  const nextOwner = args.owner ? String(args.owner).trim() : prevOwner;
  const nextRepo = args.repo ? String(args.repo).trim() : prevRepo;
  if (!/^[A-Za-z0-9._-]+$/.test(nextOwner)) fail(`"${nextOwner}" is not a valid GitHub owner.`);
  if (!/^[A-Za-z0-9._-]+$/.test(nextRepo)) fail(`"${nextRepo}" is not a valid repository name.`);
  let readme = readFileSync(README_PATH, "utf8");
  readme = replaceAll(readme, `${prevOwner}/${prevRepo}`, `${nextOwner}/${nextRepo}`);
  writeFileSync(README_PATH, readme);
  config.owner = nextOwner;
  config.repo = nextRepo;
  changes.push(`README.md + makefun.config.json: repository ${prevOwner}/${prevRepo} -> ${nextOwner}/${nextRepo}`);
}

writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n");

if (changes.length === 0) {
  console.log("configure: nothing changed.");
} else {
  for (const c of changes) console.log("configure: " + c);
  console.log("configure: done. Re-run `npm run screenshot` to refresh ad.png, then `npm test`.");
}
