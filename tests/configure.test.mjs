// Functional test for scripts/configure.mjs: it must swap the referral code
// across index.html + makefun.config.json (and owner/repo in README.md) and be
// reversible, without touching the real working tree. Runs against a temp copy.

import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = join(ROOT, "scripts", "configure.mjs");

function scratch() {
  const dir = mkdtempSync(join(tmpdir(), "bth-config-"));
  for (const f of ["index.html", "README.md", "makefun.config.json"]) cpSync(join(ROOT, f), join(dir, f));
  return dir;
}

function run(dir, args) {
  return spawnSync(process.execPath, [SCRIPT, "--root", dir, ...args], { encoding: "utf8" });
}

test("configure swaps the referral code everywhere and can swap it back", () => {
  const dir = scratch();
  try {
    const before = readFileSync(join(dir, "index.html"), "utf8");
    const code = JSON.parse(readFileSync(join(dir, "makefun.config.json"), "utf8")).referralCode;

    const r1 = run(dir, ["--code", "testcode42"]);
    assert.equal(r1.status, 0, r1.stderr);

    const after = readFileSync(join(dir, "index.html"), "utf8");
    assert.ok(after.includes("make.fun/r/testcode42"), "the new link must be present");
    assert.ok(!after.includes(code), "the old code must be gone");
    assert.equal(
      JSON.parse(readFileSync(join(dir, "makefun.config.json"), "utf8")).referralCode,
      "testcode42",
    );
    assert.match(after, /<meta name="makefun-referral-code" content="testcode42">/);
    assert.match(after, /<link rel="canonical" href="https:\/\/make\.fun\/r\/testcode42">/);
    assert.notEqual(after, before);

    const r2 = run(dir, ["--code", code]);
    assert.equal(r2.status, 0, r2.stderr);
    assert.equal(readFileSync(join(dir, "index.html"), "utf8"), before, "round-trip must restore the file");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("configure rewrites the README badge owner/repo and rejects bad input", () => {
  const dir = scratch();
  try {
    const r = run(dir, ["--owner", "acme", "--repo", "my-ad"]);
    assert.equal(r.status, 0, r.stderr);
    const readme = readFileSync(join(dir, "README.md"), "utf8");
    assert.ok(readme.includes("badge/bring-the-humans-01/acme/my-ad/rank.svg"));
    assert.ok(readme.includes("badge/bring-the-humans-01/acme/my-ad/reward.svg"));

    const bad = run(dir, ["--code", "no spaces allowed"]);
    assert.equal(bad.status, 1, "an invalid code must be refused");
    assert.match(bad.stderr, /not a valid referral code/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
