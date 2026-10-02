# Editing the site's words — a content map

Every piece of text a visitor can see, and which file to change it in.

## The site in one picture

```
bingyixuan.com/            first page: pick "The Classroom" or "The Standard CV"
├── (same page) #room      the 3D classroom            index.html + content.js + scene.js + sidedesk.js + app.js
└── old/                   the standard / professional CV page   old/index.html (plain HTML)
```

**House rule for now (Oct 2026):** the site stays light. It lists what exists — labs, project
names, roles — with **no descriptions**, it leaves out work that is still in progress, and the
CV itself is **available on request** rather than posted. Nothing on the site links to a CV file.

**There are two copies of your CV text**: the classroom reads `content.js`; the standard CV is
hand-written HTML in `old/index.html`. When a fact changes (new paper, new job), change it in
**both**.

| File | What's in it | How hard |
| --- | --- | --- |
| **`content.js`** | Every panel in the classroom. ~95% of the classroom's words. | Easy — plain text in quotes |
| **`old/index.html`** | The whole standard CV page. | Easy — plain HTML |
| **`index.html`** | The first page (the two choices) and the on-screen buttons | Easy — plain HTML |
| **`scene.js`** | Text *painted onto 3D objects* — posters, pennants, book covers, laptop screen | Harder — buried in drawing code |
| **`sidedesk.js`** | The side-projects desk: the rabbit, the robot, the "SIDE PROJECTS" sign | Harder — 3D code |
| **`app.js`** | Behaviour: looking around, the dots, the bottom bar, the panels, the game | Only for behaviour changes |

**If a panel slides open, the words are in `content.js`.** That's the file you want 9 times out of 10.

---

# Part 1 — `content.js` (the classroom panels)

One big `window.CONTENT = { … }` object. Each top-level key is one panel. Edit the text
between the quotes. Keep the quotes, commas, and brackets.

Every block starts with the same three fields:

- `kicker` — the small uppercase label at the top of the panel
- `title` — the big heading
- `sub` — the one-line description under the heading

### How a visitor gets to a panel

Clicking anything in the room is two steps: the **first click walks you over** to it and shows
a small caption beside it (its title and `sub` line from the block below); the **second click**
— on the thing or on the caption's button — opens the full panel. Esc, or "← Back to my seat",
walks you back. The bottom bar skips straight to the panel. The robot is the exception: its
first click brings up the rock-paper-scissors buttons beside it.

How close you stand, the caption's look, and the button wording are per-object tables at the
top of the "walking over to things" section in `app.js` (`VIEWS`, `PEEK_STYLE`, `PEEK_CTA`).

### The blocks, and how a visitor opens them

| Key | Opens from… |
| --- | --- |
| `profile` | *(not shown directly)* |
| `whiteboard` | The big chalkboard, or **Research** in the bottom bar |
| `leftboard` | The left board, or **About** |
| `rightboard` | The ribbons on the right, or **Contact** |
| `textbook` | The blue textbook, or **Publications** |
| `assignment` | The sheet of paper on the teacher's desk, or **Thesis** |
| `maker` | The rabbit or the robot on the side desk, or **Side projects** |
| `bulletin` | **Experience** in the bottom bar (there is no object for it in the room) |
| `notebook` | The diary on the desk |
| `bookshelf` | The bookshelf on the right wall |
| `laptop` | The laptop screen |
| `pencil`, `mug`, `eraser`, `globe`, `window`, `clock` | The object of that name |

The bottom bar and the previous/next buttons follow the `SECTIONS` list at the top of `app.js`.

### Research projects — `whiteboard.items`

Names only, on purpose — each entry says the project exists and where.

```js
{ num: '02', title: 'AI Tutor for Jupyter Notebooks',
  lab: 'MadCSE Lab, UW–Madison', pi: 'Prof. Meenakshi Syamkumar', when: 'Aug 2025 – Jun 2026',
  outcome: 'Full paper, SIGCSE TS 2027 (to appear)' },
```

| Field | What it is | Where it shows |
| --- | --- | --- |
| `num` | The number | Chalkboard + panel |
| `title` | Project name — keep it short | Chalkboard + panel |
| `lab`, `when` | Where and when | Chalkboard + panel |
| `pi` | The PI | Panel |
| `outcome` | Optional result line, e.g. a paper | Panel |
| `href` + `link` | Optional real link and its label | Panel. **Leave `href` out and no link is shown.** |

The chalkboard lists every project (up to ten, in two columns). Clicking it walks you up to
read it; clicking again, or **Research** in the bottom bar, opens the panel. **To add a
project:** copy a whole `{ … },` block, paste it, change the fields, and renumber `num`.

### About — `leftboard`

- `body` — paragraphs (each string is one paragraph).
- `education` — the list under the paragraphs: `school`, `when`, `degree`, optional `notes`.
- `board` — the three chalk lines painted on the 3D board itself: `line1`, `line2`, and `tags`.
  Keep them short; long lines run off the board.

### Publications — `textbook.pubs`

`tag` (e.g. `'C1'`), `authors` (wrap your name in `<strong>…</strong>`), `title`, `venue`,
and optional `href` + `link`.

### Thesis — `assignment`

`sub` holds the title and advisor. `body` (paragraphs) and `href` + `link` are supported but
empty right now. `paper` is the handwritten lines on the 3D sheet (one string per line, about
22 characters each).

### Side projects — `maker`

`rabbit` and `robot` each have `title`, `status`, and `desc`. `robot.cheatNote` is what the
robot says after its first win. The game's wording ("Paper covers rock…")
is in `app.js` — search for `WHY`.

### Experience — `bulletin.items`

`kind` (Teaching / Industry / Service / Honor), `title`, `org`, `meta` (dates). An optional
`desc` sentence is supported but none are used right now.

### Contact — `rightboard.contacts`

```js
{ label: 'Email', val: 'bingyxdong@gmail.com', href: 'mailto:bingyxdong@gmail.com', icon: 'email' },
```

`label` = row name, `val` = visible text, `href` = where it goes, `icon` = `email`, `github`,
`linkedin`, `website` or `cv`. **Change `val` and `href` together.** These also become the
ribbons on the wall (up to five are drawn).

### Favorite books — `bookshelf`

Click the bookshelf in the room. Add books to `books`:

```js
{ title: 'Book title', author: 'Author', note: 'One line on why (optional)' },
```

While `books` is empty the panel shows the `empty` sentence instead.

### Text-list blocks — `body: [ … ]`

`pencil`, `mug`, `eraser`, `window`, `clock`, `globe` all use a `body:` array. **Each string is
one paragraph.** You can use `<strong>…</strong>` inside.

### Other lists

- **Diary entries** — `notebook.entries`: `date`, `title`, optional `excerpt`.
- **Laptop demos** — `laptop.demos`: `title`, `meta`, optional `desc`, `href`, `link`.

### Quoting gotcha

Strings are wrapped in `'single quotes'`. If your text contains an apostrophe, either escape
it (`'I\'ve been'`) or wrap the whole thing in double quotes (`"I've been"`). Get this wrong
and the classroom never loads — open the browser console (`Cmd+Option+J`) and it names the line.

---

# Part 2 — `old/index.html` (the standard CV)

Plain HTML, top to bottom in the order you see it, built like a typical academic homepage:

1. **Hero** — photo, a two-paragraph bio ("I work with …; previously …"), a few topic tags,
   and "CV available on request".
2. **Publications**
3. **Projects** — the rabbit, the robot, MathVisual.
4. **Background** — Education, Research, Teaching & work, Honors: one line each, names only.
5. **Contact**

Search for the text you want to change and edit it in place.

- **Add a line to Background:** copy an `<li class="entry-row">` block inside the right list.
  The small second line is the `<span class="row-sub">`.
- **Add a personal project:** copy a `project-card` `<article>` in the Projects section.
- **Styles** are in `old/css/style.css`; the nav highlighting uses the `sections` list in
  `old/js/main.js` — add a section's id there if you add a section.

---

# Part 3 — `index.html` (first page + on-screen buttons)

### The first page

Two cards side by side — search for `class="choices"`:

| What | Search for |
| --- | --- |
| Your name and the line under it | `intro-head-name`, `intro-head-role` |
| "One CV, two ways to read it" | `intro-q` |
| Left card (the classroom): tag, title, description, the three facts, button | `choice-room` |
| Right card (the standard CV): same parts | `choice-pro` |
| The **"Work in progress"** line | `intro-disclaimer` — delete the `<p>` to remove it |

A link to `bingyixuan.com/#room` skips this page and goes straight into the classroom.

### On-screen buttons in the classroom

| Text | Search for |
| --- | --- |
| `Standard CV →` (top right) | `hud tr` |
| `Click anything to walk over to it · click again for more · drag to look around` | `id="hint"` (the touch-screen wording is in `app.js`, search `isTouch`) |
| `◎ recenter`, `← Back to my seat` | `recenterBtn`, `seatBtn` |
| The bottom bar (About · Research · …) | `SECTIONS` at the top of `app.js` |

### Browser tab title

`<title>` near the top of `index.html`, plus the `<meta name="description">` just below.

### Hover labels

The little tooltip when you hover an object. In `scene.js`, search for `userData.label` —
one line per object. The rabbit's and robot's are in `sidedesk.js`.

---

# Part 4 — `scene.js` (words painted on 3D objects)

These are drawn into canvas textures, so they live inside drawing code. Search for the
string, change it, save, hard-refresh.

| What | Search for |
| --- | --- |
| Chalkboard header | `'RESEARCH'` (the title and the list come from `content.js`) |
| Left board fixed words | `ABOUT ME`, `Hi, I'm`, `Mason.`, `click for more` (the role lines and tags come from `content.js` → `leftboard.board`) |
| Wall posters | `makePoster(` — each word goes on its own line, keep to 3–4 words |
| Pennants on the left wall | `makePennant(` — `'WISC'` and `'UW'`; short words only |
| Textbook cover | `'Publications'` |
| Diary cover | `'Diary'` |
| Thesis sheet heading | `Turned in` (the lines below it come from `content.js` → `assignment.paper`) |
| Laptop screen mock-up | `course-audit` |

The living details — goldfish, solar-system mobile, spinning globe, the paper airplane that
misses the trash can — are also in `scene.js`: search `goldfish`, `mobile`, `the globe turns`,
`paper-airplane sortie`. The rabbit's hopping and the robot's hands are in `sidedesk.js`.

---

# After you edit

### 1. Bump the cache version — required for JS edits

If you changed **`content.js`, `sidedesk.js`, `scene.js`, or `app.js`**, open `index.html`,
go to the `<script src=…>` lines near the bottom, and bump all four numbers together:

```html
<script src="content.js?v=39"></script>    →   ?v=40
<script src="sidedesk.js?v=39"></script>   →   ?v=40
<script src="scene.js?v=39"></script>      →   ?v=40
<script src="app.js?v=39"></script>        →   ?v=40
```

Skip this and returning visitors keep seeing the old version. Not needed for HTML-only edits.

### 2. The CV

The CV is **not on the site**. `cv.html` is a small "CV available on request" page (old links
to it still land somewhere sensible), and the PDF files were removed. To post a CV again
later, add the file and link to it from `old/index.html` and `content.js` → `rightboard.contacts`.

### 3. Preview, then publish

```bash
python3 -m http.server 8000     # then open http://localhost:8000
```

Hard-refresh with `Cmd+Shift+R`.

```bash
git add -A && git commit -m "Update research projects" && git push
```

See `RUNNING.md` for the full command reference.

---

# Quick lookup

| I want to change… | Go to |
| --- | --- |
| A research project name | `content.js` → `whiteboard.items` (classroom) · Background list in `old/index.html` |
| My bio | `content.js` → `leftboard.body` **and** the hero in `old/index.html` |
| Education | `content.js` → `leftboard.education` **and** `old/index.html` (Background) |
| Publications | `content.js` → `textbook.pubs` **and** `old/index.html` |
| The rabbit / robot descriptions | `content.js` → `maker` **and** `old/index.html` (Projects) |
| Teaching, jobs, honors | `content.js` → `bulletin.items` **and** `old/index.html` (Background) |
| Email / GitHub / LinkedIn | `content.js` → `rightboard.contacts` **and** `old/index.html` + `old/js/main.js` (email) |
| Favorite books | `content.js` → `bookshelf.books` |
| Diary entries | `content.js` → `notebook.entries` |
| The first page | `index.html` — search `choices` |
| The "Work in progress" line | `index.html` — search `intro-disclaimer` |
| Browser tab title | `index.html` `<title>` |
| Wall poster slogans, pennants | `scene.js` — `makePoster(`, `makePennant(` |
| Hover tooltips | `scene.js` / `sidedesk.js` — `userData.label` |
