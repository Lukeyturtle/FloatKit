# 🏝️ FloatKit

Design your own modular inflatable **floating platform** — pick an anchor, snap
customizable squares together on the water, connect them (bridges, ziplines,
swim ladders, spaced tethers), and share your build.

FloatKit is a **100% static** site (plain HTML/CSS/vanilla-JS ES modules — no
build step, no dependencies). It runs entirely in the browser and is designed
to be hosted on **GitHub Pages**.

> Concept prototype. "FloatKit" is a working name.

## Run locally

Any static file server works — for example:

```bash
cd floatkit
python3 -m http.server 8000
# open http://localhost:8000
```

(Open it through a server, not `file://` — ES modules need HTTP.)

## Sharing & 6-digit codes

When you finish a design and click **“Request early access & get my code”** you get:

- **A share link** (`…/?c=CODE#d=…`). The design is packed into the link itself,
  so it opens **instantly**, offline, with no Google setup required. This is the
  reliable way to share.
- **A 6-digit code.** Appending it to the site URL (`…/?c=123456`, or the pretty
  path `…/123456`) loads the design. Bare codes are looked up in your Google
  Sheet, so they only work **after** the early-access form is submitted, and can
  take a few minutes to appear (Google's publish cache). The full link has no
  such delay.

Shared designs open **read-only** — visitors can click squares and step through
the build, then hit **Remix** to make an editable copy.

## Optional: connect a Google Form + Sheet

Edit [`js/config.js`](js/config.js) — it has step-by-step comments. In short:

1. Create a Google **Form** with your early-access questions plus a **Code**
   (short answer) and **Design** (paragraph) field. Link it to a **Sheet**.
2. Form → ⋮ → **Get pre-filled link**; copy the base URL and the two `entry.…`
   IDs into `FORM` in `config.js`.
3. Sheet → **File → Share → Publish to web → CSV**; copy that URL into
   `SHEET_CSV_URL`. Make sure the column headers match `CODE_COLUMN` /
   `DESIGN_COLUMN`.

Until you do this, the code + share link still work — only the “open form”
button and bare-code lookup need it.

## Deploy to GitHub Pages

From the `floatkit/` folder:

```bash
git init
git add -A
git commit -m "FloatKit"
# create the repo (needs the GitHub CLI, logged in):
gh repo create FloatKit --public --source=. --remote=origin --push
```

Then in the repo: **Settings → Pages → Build and deployment → Deploy from a
branch → `main` / `/ (root)`**. Your site appears at
`https://<your-username>.github.io/FloatKit/`.

- `.nojekyll` is included so GitHub Pages serves `js/screens/_optionPicker.js`
  (files starting with `_` are otherwise dropped by Jekyll).
- `404.html` rewrites `…/FloatKit/123456` → `…/FloatKit/?c=123456` so bare codes
  work as a path too.

## Project layout

```
index.html          app shell + read-only banner
styles.css          all styling (aquatic theme, responsive)
404.html            GitHub Pages code-path shim
.nojekyll           disable Jekyll (serves _-prefixed files)
js/
  main.js           boot + share-link/code detection
  state.js          design state, persistence, read-only mode
  router.js         screen navigation
  catalog.js        product data (squares, connectors, anchors, grid)
  render.js         shared UI helpers, platform preview, PNG export
  share.js          encode/decode, codes, links, Sheet lookup
  config.js         your Google Form/Sheet settings
  screens/          one module per screen
```
