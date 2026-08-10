# Editing the site's words — a content map

Every piece of text a visitor can see, and exactly which file and line to change it in.

## The one rule that saves you time

Text lives in **three** places, in descending order of how often you'll touch them:

| File | What's in it | How hard |
| --- | --- | --- |
| **`content.js`** | ~95% of the words. Every panel that opens when you click something. | Easy — plain text in quotes |
| **`index.html`** | The intro screen, the on-screen buttons/HUD, the plain-text CV headings | Easy — plain HTML |
| **`scene.js`** | Text *painted onto the 3D objects themselves* — posters, pennants, book spine, laptop screen | Harder — buried in drawing code |

**If you can click it and a panel slides open, the words are in `content.js`.**
That's the file you want 9 times out of 10.

---

# Part 1 — `content.js` (the panels)

One big `window.CONTENT = { … }` object. Each top-level key is one clickable thing in
the room. Edit the text between the quotes. Keep the quotes, commas, and brackets.

Every block shares the same three opening fields:

- `kicker` — the small uppercase label at the top of the panel
- `title` — the big heading
- `sub` — the one-line description under the heading

Then each has its own body content.

### The blocks, and what you click to see them

| Key | Line | You see it by clicking… |
| --- | --- | --- |
| `profile` | 4 | *(not shown directly — name/role used elsewhere)* |
| `whiteboard` | 11 | The big whiteboard — your 5 research projects |
| `leftboard` | 39 | The left board — "Hi, I'm Mason." |
| `rightboard` | 50 | The right board — contact info |
| `notebook` | 63 | The diary on the desk |
| `textbook` | 74 | The textbook — publications & talks |
| `laptop` | 85 | The laptop screen |
| `pencil` | 92 | The pencil |
| `mug` | 101 | The coffee mug |
| `eraser` | 112 | The eraser |
| `assignment` | 121 | Today's assignment — your thesis |
| `bulletin` | 131 | The cork bulletin board |
| `window` | 144 | The window |
| `clock` | 154 | The clock on the back wall |
| `globe` | 161 | The globe |

### The whiteboard projects — `content.js:15–36`

This is the one you asked about. Five entries in an `items:` list. Each looks like:

```js
{ num: '01', title: 'Tools in CS Education — a systematic review',
  meta: 'MadCSE Lab · 2025–present',
  desc: 'Systematic analysis of 4,500+ research papers…',
  link: 'Read the outline →' },
```

| Field | What it is | Example |
| --- | --- | --- |
| `num` | The number badge | `'01'` |
| `title` | Project name | `'Robot Plan B'` |
| `meta` | Lab · dates line | `'MAGIC Lab · 2025–present'` |
| `desc` | The paragraph | `'Designing VR activities…'` |
| `link` | The link label at the bottom | `'Study design →'` |

**To add a sixth project:** copy one whole `{ … }` block including its trailing comma,
paste it after `05`, and change the fields. **To remove one:** delete the whole block.
Renumber `num` so they stay in order.

Header text for the whiteboard is just above the list:
- `kicker` line 12 — "The whiteboard · Research & projects"
- `title` line 13 — "Things I've been working on"
- `sub` line 14 — "A snapshot of my current research…"

### Text-list blocks — `body: [ … ]`

`leftboard`, `pencil`, `mug`, `eraser`, `assignment`, `window`, `clock`, `globe` all use a
`body:` array. **Each string is one paragraph.** Add a paragraph by adding a
`'new string',` on its own line. That's it.

The clock's is a single line you may want to make your own — `content.js:158`:
> `'You are not late. You are not early. You are right on time.'`

### Contacts — `content.js:54–59`

```js
{ label: 'Email', val: 'bingyxdong@gmail.com', href: 'mailto:bingyxdong@gmail.com' },
```

`label` = row name, `val` = the visible text, `href` = where it actually goes. **Change
both `val` and `href` together** or the link will point somewhere wrong. LinkedIn on
line 57 is currently `href: '#'` (a dead link) with "— coming soon" in the text.

### Other list-shaped blocks

- **Diary entries** — `content.js:67–71`. Fields: `date`, `title`, `excerpt`.
- **Publications** — `content.js:78–82`. Fields: `date`, `title`, `venue`, `link`.
- **Bulletin board** — `content.js:135–141`. Fields: `kind` (Honor/Teach/Service/Intern), `title`, `meta`.

### Quoting gotcha

Strings are wrapped in `'single quotes'`. If your text contains an apostrophe, either
escape it (`'I\'ve been'`) or wrap the whole thing in double quotes (`"I've been"`).
Both styles are already used in the file. Get this wrong and the page goes blank.

---

# Part 2 — `index.html` (intro screen + on-screen chrome)

### The opening card (the chalkboard loader)

Search for these strings — the card now animates in (self-drawing sketch, lettered
title, pencil progress line):

| What | Where |
| --- | --- |
| `· the interactive cv of ·` — the small kicker | `index.html`, search for `intro-kicker` |
| `The Classroom` — the title, **one `<span>` per letter** | search for `intro-title` |
| Name + role line under the title | search for `intro-name` |
| The **"Work in progress"** disclaimer | search for `intro-disclaimer` — delete the div to remove it |
| `Class begins in 8s…` — the countdown text | `index.html:529` |
| `Enter the Classroom →` / `Résumé (PDF) ↓` / `Standard CV site ↗` buttons | search for `intro-options` |
| The chalk sketch that draws itself | the `intro-sketch` SVG — each `<path>` is one stroke; `animation-delay` sets draw order |

The countdown also gets rewritten live by **`app.js:87`** — change the wording in *both*
places or it'll flip after one second. Its **length** is `INTRO_SECS` at **`app.js:52`**
(currently `8`), not the HTML. The pencil + chalk line are driven from the same spot in
`app.js` (`introLine` / `introPencil`).

After editing `app.js`, `scene.js`, or `content.js`, bump the `?v=` number on the three
script tags at **`index.html:647–649`** — browsers cache those files hard, and without the
bump you'll keep seeing the old behaviour.

### On-screen HUD

| Text | Where |
| --- | --- |
| `📄 Résumé` chip (links to `cv.html`) | `index.html:550` |
| `Skip the scene →` | `index.html:551` |
| `Move your mouse to look around · click anything that glows` | search for `id="hint"` |
| `◎ recenter` / `🔇 ambient` (toggle also at **`app.js`**, search `soundBtn`) | search for `hud br` |

### Browser tab title — `index.html:14`

`<title>Bingyixuan (Mason) Dong — CV · The Classroom</title>` (+ a `<meta name="description">` just below)

### Hover labels

The little tooltip when you hover an object. These are in `scene.js`, one line each:

| Line | Label |
| --- | --- |
| 795 | `Projects` (the board itself; per-project labels come from `content.js` titles) |
| 880 | `About me` |
| 1024 | `Today's assignment` (thesis paper on the teacher's desk) |
| 1297 | `Open the diary` |
| 1351 | `Publications & talks` |
| 1538 | `Open live demo` |
| 1553 | `A fun fact` |
| 1612 | `Current rotation` |
| 1639 | `Things I changed my mind about` |
| 1784 | `Where I've been` |
| 2172 | `Out the window` |
| 2260 | `The clock` |

### Plain-text CV page

Headings only (About, Research & projects, Honors thesis, Diary, …). The content
underneath is **generated from `content.js`**, so you don't edit it twice. The intro
paragraph is hardcoded — search for `fb-lede`.

---

# Part 3 — `scene.js` (words painted on 3D objects)

These are drawn into canvas textures, so they're inside JavaScript drawing code. Change
the string, save, hard-refresh.

### Wall posters — `scene.js:2016–2017`

```js
makePoster(roomW/2 - 0.02, 2.1, 0.2, -Math.PI/2, 'Be Curious Ask Often', 0x2f5d8f);
makePoster(roomW/2 - 0.02, 2.1, 1.6, -Math.PI/2, 'Show Your Work',      0xc2583a);
```

The quoted string is the poster text — **each word goes on its own line**, so keep them
short (3–4 words max). The `0x…` at the end is the accent color. The subtitle
`— classroom rules —` is at **line 1990**.

### Pennants on the left wall — `scene.js:1955–1956`

`'WISC'` and `'UW'`. Short words only — long ones overflow the triangle.

### Whiteboard header painted on the board — `scene.js:135`

`'TODAY · WHAT I'M WORKING ON'` — this is the text *on the 3D board itself*, separate
from the panel that opens when you click it. The five project cards on the board are
generated from `content.js` (titles, meta, and descriptions truncate with `…`).

### Left board painted text — `scene.js:245–296`

`'· ABOUT ME ·'`, `"Hi, I'm"`, `'Mason.'`, `'CS & Data Science'`,
`'UW–Madison · AI & Education'`, `'click for more →'`.

### Textbook spine — `scene.js:426–437`

`'Publications'` / `'& talks'` / `'B. Dong'` / `'2024 — present'`

### Diary cover — `scene.js:1244`

`'Diary'` / `'— field notes —'` / `'MMXXVI'`

### Thesis paper on the teacher's desk

Painted by `paperTexture()` (search for `Honors thesis:` in `scene.js`). Clicking it
opens the `assignment` panel from `content.js`.

### Laptop screen

`laptopScreenTexture()` draws a mock of the course-audit agent (transcript on the left,
objective-coverage bars on the right). Search for `course-audit` in `scene.js`.

### Bulletin board

Removed from the room (the back wall is now bare). The honors & teaching content still
renders on the plain-text CV page from `content.js` → `bulletin.items`; the
`bulletinTexture()` function is kept in `scene.js` in case it returns.

### The living details

The goldfish bowl (teacher's desk), the solar-system mobile (ceiling, right side), the
spinning globe, and the paper airplane that periodically flies across the room and
misses the trash can are all in `scene.js` — search for `goldfish`, `mobile`,
`the globe turns`, and `paper-airplane sortie`.

---

# After you edit

### 1. Bump the cache version — required for JS edits

If you changed **`content.js`, `scene.js`, or `app.js`**, open `index.html` lines
**647–649** and bump all three:

```html
<script src="content.js?v=36"></script>   →   ?v=37
<script src="scene.js?v=36"></script>     →   ?v=37
<script src="app.js?v=36"></script>       →   ?v=37
```

Skip this and returning visitors keep seeing the old version. Not needed for
`index.html` edits.

### 2. Preview, then publish

```bash
python3 -m http.server 8000     # then open http://localhost:8000
```

Hard-refresh with `Cmd+Shift+R`. If the page is blank, you broke a quote or comma —
open the browser console (`Cmd+Option+J`) and it'll name the line.

```bash
git add -A && git commit -m "Update whiteboard projects" && git push
```

See `RUNNING.md` for the full command reference.

---

# Quick lookup

| I want to change… | Go to |
| --- | --- |
| A research project | `content.js:15–36` |
| My bio paragraphs | `content.js:43–47` |
| Email / GitHub / LinkedIn | `content.js:54–59` |
| Diary entries | `content.js:67–71` |
| Publications | `content.js:78–82` |
| Honors & teaching | `content.js:135–141` |
| Thesis description | `content.js:121–129` |
| Intro screen title | `index.html` — search `intro-title` |
| The "Work in progress" notice | `index.html` — search `intro-disclaimer` |
| Intro buttons | `index.html` — search `intro-options` |
| The mouse hint | `index.html` — search `id="hint"` |
| Browser tab title | `index.html:14` |
| Wall poster slogans | `scene.js:2016–2017` |
| Pennant text (WISC / UW) | `scene.js:1955–1956` |
| Hover tooltips | `scene.js` — see table above |
| Bulletin cards (honors & teaching) | `content.js` → `bulletin.items` |
