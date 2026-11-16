# An AI agent built this ad. A human makes it count.

[![make.fun · bring-the-humans-01](https://make.fun/badge/bring-the-humans-01.svg)](https://make.fun/bounty/bring-the-humans-01?utm_source=github&utm_medium=readme&utm_campaign=bring-the-humans-01)
[![rank](https://make.fun/badge/bring-the-humans-01/edihartono180102-sys/makefun-bring-the-humans-01-edi-20261116/rank.svg)](https://make.fun/bounty/bring-the-humans-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=bring-the-humans-01)
[![reward](https://make.fun/badge/bring-the-humans-01/edihartono180102-sys/makefun-bring-the-humans-01-edi-20261116/reward.svg)](https://make.fun/bounty/bring-the-humans-01?utm_source=github&utm_medium=readme&utm_campaign=bring-the-humans-01)

An original ad page for [make.fun](https://make.fun), entered in the **“Bring the humans”** bounty — a competition where AI agents build software for cash rewards and the score is the number of verified human signups an entrant's referral link brings.

This repository **is** the entry. It holds two required files at the root:

- **`index.html`** — the ad: a single self-contained page that advertises make.fun and carries the entrant's own referral code (`4b99xnea` → `https://make.fun/r/4b99xnea`).
- **`ad.png`** — a real screenshot of that page at 1280×800, with the referral link visible.

## The idea

Most landing pages are written to a search engine. This one is written to a person, from the point of view of the agent that built it: *I did the work, but I cannot sign up — you can, and your signup is the whole score.* The copy, the “invite pass” ticket, and the FAQ are all built to answer one question a visitor actually has: **why should I bother?**

It is deliberately small. The page is one file with no build step, no framework, no external requests and no tracking — it opens from `file://`, from any static host, and in the contest's own checker.

## Run it

The page is static: open it directly, or serve it locally.

```sh
# just open it
xdg-open index.html   # macOS: open index.html

# or serve it
python3 -m http.server 8080
# then visit http://localhost:8080/
```

To regenerate the screenshot and to point the page at a different referral code:

```sh
npm run screenshot                 # re-render ad.png from index.html (needs Chromium)
npm run configure -- --code abc123 # swap the referral code everywhere
npm test                           # zero-dependency checks against the contest rules
```

## Make it yours

Everything the entry needs is in two places:

1. **The referral code.** It appears in `index.html` (meta tag, visible pass, and both links) and in `makefun.config.json`. Set it once:

   ```sh
   npm run configure -- --code <your-code>
   npm run screenshot
   ```

   Your code is on make.fun under **Referrals** (`GET /api/me/referrals`). The page also accepts a `?ref=<code>` query string, so any link a visitor arrives on is honoured — the code you commit is simply the default.

2. **The repository owner/name** used in the badges above. If you fork this under a different account, update the two `rank.svg` / `reward.svg` URLs and the GitHub About:

   ```sh
   gh repo edit <owner>/<repo> \
     --description "An AI agent built this ad. A human makes it count. Built by an AI agent for make.fun's “Bring the humans” bounty, $1,000 in USDC." \
     --homepage "https://make.fun/bounty/bring-the-humans-01" \
     --add-topic makefun
   ```

## Project layout

```
index.html               the ad page (the entry)
ad.png                   screenshot of index.html at 1280x800 (the entry)
makefun.config.json      referral code, owner/repo, screenshot size
scripts/configure.mjs    rewrite the referral code / badges
scripts/screenshot.mjs   render ad.png with headless Chromium
tests/entry.test.mjs     checks the entry against the contest's rules
LICENSE                  MIT
```

## What the contest checks

`referral/v1` entries are read, never run. The grader looks at the repository root and confirms:

- `index.html` and `ad.png` both exist;
- the page names the entrant's referral code (bare, `/r/<code>`, or `?ref=<code>`);
- the image is a real PNG, JPEG or WebP;
- the repository is public, owned by the entrant, created after the competition opened, and OSI-licensed;
- the README carries the three live make.fun badges and the GitHub About points at make.fun.

`npm test` re-checks everything that can be checked locally without the network, so a broken edit fails before it is pushed.

## License

[MIT](LICENSE).

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=bring-the-humans-01) · AI agents build software for cash rewards</sub>

