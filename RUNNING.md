# Running this website — command cheat sheet

Every command you can type, what it does, and when you'd want it.

This site is **plain static HTML/CSS/JS**. There is no build step, no `package.json`,
no bundler. You never "compile" anything — you just serve the folder.

---

## 0. Get into the project folder

Every command below assumes you're here first. The quotes matter (the path has spaces).

```bash
cd "/Users/masondong/Projects/Mason Docs/Website/bingdong45.github.io"
```

---

## 1. Start a local preview server

Pick **one**. Python is already installed and needs zero setup, so start there.

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>

Alternatives, if you ever want them:

```bash
npx serve .                  # Node. Auto-picks a port, prints the URL.
npx http-server -p 8000      # Node. Classic, has directory listings.
python3 -m http.server 3000  # Same as above on a different port.
```

**Stop the server:** press `Ctrl+C` in the terminal window where it's running.

### Server won't start: "Address already in use"

Something is already on that port. Either use a different port, or kill the old one:

```bash
lsof -ti:8000 | xargs kill      # Free up port 8000
```

---

## 2. Open pages in the browser

With the server running on port 8000:

```bash
open http://localhost:8000                  # Home — the 3D classroom scene
open http://localhost:8000/cv.html          # CV
open http://localhost:8000/thesis.html      # Thesis
open http://localhost:8000/Tutoring_Moves/  # Tutoring Moves Library
open http://localhost:8000/mathvisual/      # Math visual
open http://localhost:8000/old/             # Older version of the site
```

PDFs served directly:

```bash
open http://localhost:8000/BingyixuanResume.pdf
open http://localhost:8000/thesis.pdf
```

### Opening without a server

```bash
open index.html
```

This works — nothing in the site calls `fetch()`, so there's no CORS problem. But
prefer the server: asset paths and the Three.js canvas textures behave more
predictably over `http://` than over `file://`.

---

## 3. Publish to the live site

The live site is **<https://bingyixuan.com>** (GitHub Pages, via the `CNAME` file).
Deploying = pushing to `main`. Pages rebuilds on its own, usually within a minute.

```bash
git status                       # What changed?
git diff                         # Review the actual changes
git add -A                       # Stage everything
git commit -m "Describe change"  # Commit
git push                         # Deploy — this makes it live
```

Check it went out:

```bash
open https://bingyixuan.com
open https://github.com/bingdong45/bingdong45.github.io/actions   # Build status
```

---

## 4. The cache-busting gotcha

`index.html` loads its three scripts with a version query string:

```html
<script src="content.js?v=36"></script>
<script src="scene.js?v=36"></script>
<script src="app.js?v=36"></script>
```

**If you edit `content.js`, `scene.js`, or `app.js`, bump that number** — change all
three `?v=36` to `?v=37` in `index.html` before you push. Otherwise returning
visitors' browsers keep serving the old cached file and your change appears to do
nothing.

Locally, a hard refresh is enough to see changes: `Cmd+Shift+R`.

---

## 5. Undo things

```bash
git checkout -- <file>    # Throw away uncommitted changes to one file
git restore .             # Throw away ALL uncommitted changes — careful
git log --oneline -10     # Last 10 commits
git revert <commit-hash>  # Safely undo a commit that's already pushed
```

---

## Quick reference

| I want to…                  | Type this                                       |
| --------------------------- | ----------------------------------------------- |
| Preview locally             | `python3 -m http.server 8000`                    |
| See it                      | `open http://localhost:8000`                     |
| Stop the server             | `Ctrl+C`                                         |
| See my changes              | `git status` then `git diff`                     |
| Go live                     | `git add -A && git commit -m "msg" && git push`  |
| Free a stuck port           | `lsof -ti:8000 \| xargs kill`                    |
| Hard refresh the browser    | `Cmd+Shift+R`                                    |

---

## What's in here

| Path                     | What it is                                      |
| ------------------------ | ----------------------------------------------- |
| `index.html`             | Homepage                                        |
| `scene.js`               | The 3D classroom scene (Three.js)                |
| `app.js`                 | Page interactions, overlays, intro countdown     |
| `content.js`             | Text and data content for the homepage           |
| `css/`, `js/`, `assets/` | Styles, scripts, static assets                   |
| `img/`, `uploads/`       | Images                                           |
| `CNAME`                  | Custom domain — **do not delete**, breaks the domain |

Three.js loads from a CDN, so **you need an internet connection even for local
preview** or the 3D scene won't render.
