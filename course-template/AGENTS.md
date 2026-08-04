# AI guide: packaging a CourseDesk course

This folder is the **tracked template** for [CourseDesk](../README.md) course packages. Real course content (videos, notes, generated `course.js`) lives under `courses/` and is **gitignored**.

When the user drops in videos, notes, or assets and asks you to “add a course” or “structure this,” follow this guide end-to-end.

---

## Goals

1. Produce a self-contained package at `courses/<course-id>/`.
2. Wire it into the library via `courses/catalog.js` and `index.html`.
3. Never invent video filenames — use the files that actually exist on disk.
4. Keep large media out of git (`courses/` is ignored).

---

## Target layout

```text
courses/<course-id>/
  course.js          # required — registers global.COURSES[<course-id>]
  notes.js           # optional — registers global.COURSE_NOTES[<course-id>]
  videos/            # lecture videos (mp4, webm, …)
  assets/            # optional images, pdfs, zip downloads, …
```

Copy structure from `course-template/` (this directory). Do **not** edit the template in place as the live course — always copy into `courses/<course-id>/`.

---

## Naming rules

| Item | Rule | Example |
|------|------|---------|
| Course id / folder | kebab-case, stable, unique | `react-native-2026` |
| Video files | Prefer `NNN-slug.ext` sort order | `001-welcome.mp4` |
| Lesson `id` | Stable slug; often mirrors video stem | `001-welcome` |
| Lesson `num` | Display number string | `"01"` or `"001"` |
| Category `id` | kebab-case | `getting-started` |
| `video` path | Relative to course folder | `videos/001-welcome.mp4` |

- `course.id`, folder name, `COURSES` key, `COURSE_NOTES` key, and catalog `id` **must all match**.
- `course.root` should be `"courses/<course-id>"` when set.

---

## Step-by-step workflow

### 1. Inspect inputs

List what the user provided:

```bash
# examples — adjust paths to what they uploaded
find <upload-or-staging-dir> -type f | sort
ls -la courses/   # existing courses
```

Group files into:

- **Videos** → `courses/<id>/videos/`
- **Images / PDFs / downloads** → `courses/<id>/assets/`
- **Markdown / text notes** → content for `notes.js` (or leave empty)
- **Existing curriculum metadata** (CSV, JSON, Udemy export, filenames only)

If the user only supplies videos, derive the curriculum from filenames and optional section folders.

### 2. Choose `course-id`

- From the course title: `"React Native 2026"` → `react-native-2026`
- Or reuse an existing folder name if updating a course
- Confirm it does not collide with another entry in `courses/catalog.js`

### 3. Create the package folder

```bash
mkdir -p courses/<course-id>/videos courses/<course-id>/assets
cp course-template/course.js courses/<course-id>/course.js
cp course-template/notes.js courses/<course-id>/notes.js   # if notes needed
```

Move or copy media into place (prefer move when the user intends these files to live with the course):

```bash
# example
mv /path/to/uploads/*.mp4 courses/<course-id>/videos/
```

Normalize video names if they are messy, but **keep a clear mapping** if you rename:

```text
"1. Intro to Expo.mp4" → videos/001-intro-to-expo.mp4
```

### 4. Infer categories and lesson order

Prefer this order of sources:

1. Explicit metadata from the user (outline, CSV, existing `course.js`)
2. Parent folders (`Section 1 - Basics/video.mp4` → category “Basics”)
3. Filename prefixes (`001-…`, `01_…`)
4. Alphabetical as last resort

Create `categories[]` with stable ids and human titles. Assign every lesson a `categoryId` that exists.

### 5. Write `course.js`

Start from `course-template/course.js`. Replace:

- `"example-course"` → your id (folder key, `id`, `root`)
- `title`, `author`, `description`
- `categories` and `lessons`

Each lesson:

```js
{
  id: "001-welcome",           // required, unique in course
  num: "001",                  // optional UI number
  title: "Welcome",            // required
  categoryId: "introduction",  // required
  category: "Introduction",    // optional display
  video: "videos/001-welcome.mp4", // omit if notes-only
  duration: 125,               // optional seconds
}
```

**Rules:**

- Only set `video` if the file exists under `courses/<id>/`.
- Notes-only lessons: omit `video`.
- `duration`: set if known (ffprobe, metadata, user); otherwise omit — do not invent precise lengths.
- Preserve lesson order as the intended curriculum order (array order matters).

Use `ffprobe` when available to fill duration:

```bash
ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "courses/<id>/videos/001-welcome.mp4"
```

### 6. Write `notes.js` (optional)

Start from `course-template/notes.js`.

- Object key = course id
- Nested keys = lesson ids
- Values = Markdown strings

If there are no notes, **delete** `notes.js` and do not load it from `index.html`.

### 7. Register the course

**A. `courses/catalog.js`**

Ensure the file exists (create from the snippet below if missing). Append a catalog entry:

```js
(function (global) {
  "use strict";

  global.COURSE_CATALOG = [
    {
      id: "react-native-2026",
      title: "React Native Course 2026",
      author: "CodeWithBeto",
      description: "…",
    },
    {
      id: "<course-id>",
      title: "<Title>",
      author: "<Author>",
      description: "<Short blurb>",
    },
  ];
})(window);
```

See also `catalog.entry.js` in this folder.

**B. `index.html`**

Add script tags **before** the app scripts (`js/storage.js`), after other courses:

```html
<script src="courses/<course-id>/course.js"></script>
<script src="courses/<course-id>/notes.js"></script>  <!-- only if present -->
<script src="courses/catalog.js"></script>
```

`catalog.js` must load **after** all `course.js` / `notes.js` files (or at least after the courses it lists are registered — order among course packages is free; catalog last is safest).

Snippet reference: `index.scripts.html`.

### 8. Verify

Checklist:

- [ ] `courses/<id>/course.js` registers `COURSES["<id>"]`
- [ ] Folder name === `id` === catalog entry `id`
- [ ] Every `lesson.video` file exists
- [ ] Every `lesson.categoryId` exists in `categories`
- [ ] Lesson ids unique; notes keys only use real lesson ids
- [ ] `index.html` loads `course.js` (+ `notes.js` if any) and `catalog.js`
- [ ] Library card appears; opening a lesson plays video / shows notes
- [ ] No large media committed (confirm `courses/` is gitignored)

Quick static check:

```bash
# list videos referenced vs on disk (example with node/python as needed)
ls courses/<id>/videos | sort
```

---

## Updating an existing course

1. Do **not** recreate the id/folder unless the user wants a new course.
2. Add new videos to `videos/`, extend `lessons[]` and categories as needed.
3. Keep existing lesson `id`s stable (progress is stored by lesson id in `localStorage`).
4. Only renumber display `num` / titles if the user asks; avoid changing ids.

---

## What not to do

- Do not put real videos inside `course-template/`.
- Do not commit `courses/**` media (folder is gitignored).
- Do not hand-author fake durations or missing video paths.
- Do not load `notes.js` if the file was not created.
- Do not change player/app code unless the course format itself is insufficient.

---

## Player path resolution (reference)

From `js/app.js`:

- Prefer `course.data.root` (e.g. `courses/my-course`)
- Else `courses/<id>`
- Lesson `video: "videos/foo.mp4"` → `courses/<id>/videos/foo.mp4`

Assets linked from notes markdown should use paths the browser can resolve (typically absolute-from-site-root like `courses/<id>/assets/diagram.png`).

---

## Minimal empty catalog

If `courses/catalog.js` is missing after a fresh clone, create:

```js
(function (global) {
  "use strict";
  global.COURSE_CATALOG = [
    // { id: "my-course", title: "…", author: "…", description: "…" },
  ];
})(window);
```

Then add packages under `courses/` as above.

---

## Summary for agents

```text
User media → courses/<id>/{videos,assets}/
Template   → course-template/*  (copy, don't overwrite as live course)
Metadata   → courses/<id>/course.js  (+ notes.js)
Register   → courses/catalog.js + index.html <script> tags
Ignore     → entire courses/ tree in git
```
