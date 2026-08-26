# CourseDesk — course packaging guide

This file lives in your **courses root** (the folder you selected in CourseDesk).
When you (or an AI) add a new course, follow this guide end-to-end.

CourseDesk discovers packages by scanning **immediate child folders** that contain `course.json`.
After adding or changing a course, use **Settings → Rescan folder** (or reload the app).

---

## Target layout

```text
<this-folder>/                 ← courses root (selected in CourseDesk)
  COURSE_TEMPLATE.md           ← this guide (safe to regenerate from Settings)
  <course-id>/
    course.json                # required — metadata + curriculum
    notes/                     # optional — one Markdown file per lesson
      001-welcome.md
    videos/                    # lecture videos (mp4, webm, …)
      001-welcome.mp4
    assets/                    # optional images, pdfs, zip downloads, …
```

Optional **`resources`** on the course object list downloadable exercise files.
When present and non-empty, the player shows a **Files** tab in the course sidebar.

---

## Naming rules

| Item | Rule | Example |
|------|------|---------|
| Course id / folder | kebab-case, stable, unique | `react-native-2026` |
| Video files | Prefer `NNN-slug.ext` sort order | `001-welcome.mp4` |
| Notes files | Same stem as lesson `id` | `notes/001-welcome.md` |
| Lesson `id` | Stable slug; often mirrors video stem | `001-welcome` |
| Lesson `num` | Display number string | `"01"` or `"001"` |
| Category `id` | kebab-case | `getting-started` |
| `video` path | Relative to course folder | `videos/001-welcome.mp4` |

- `course.id` and the folder name **must match**. If they disagree, the folder name wins.
- Do not add a `notes` path on the lesson object — the player maps `notes/<lesson-id>.md` by filename.

---

## Step-by-step workflow

### 1. Inspect inputs

List what the user provided (adjust paths):

```bash
find <upload-or-staging-dir> -type f | sort
ls -la .   # existing course folders in this root
```

Group files into:

- **Videos** → `<course-id>/videos/`
- **Images / PDFs / downloads** → `<course-id>/assets/`
- **Markdown / text notes** → `<course-id>/notes/<lesson-id>.md` (or omit)
- **Existing curriculum metadata** (CSV, JSON, Udemy export, filenames only)

If the user only supplies videos, derive the curriculum from filenames and optional section folders.

### 2. Choose `course-id`

- From the course title: `"React Native 2026"` → `react-native-2026`
- Or reuse an existing folder name if updating a course
- Confirm it does not collide with another sibling folder here

### 3. Create the package folder

```bash
mkdir -p <course-id>/videos <course-id>/assets
```

Move or copy media into place. Normalize messy video names if needed, but **keep a clear mapping**:

```text
"1. Intro to Expo.mp4" → videos/001-intro-to-expo.mp4
```

### 4. Infer categories and lesson order

Prefer this order of sources:

1. Explicit metadata from the user (outline, CSV, existing `course.json`)
2. Parent folders (`Section 1 - Basics/video.mp4` → category “Basics”)
3. Filename prefixes (`001-…`, `01_…`)
4. Alphabetical as last resort

Create `categories[]` with stable ids and human titles. Assign every lesson a `categoryId` that exists.

### 5. Write `course.json`

Put a single JSON object in `<course-id>/course.json`:

```json
{
  "id": "my-course",
  "title": "My Course",
  "author": "You",
  "description": "Short library blurb.",
  "categories": [
    { "id": "getting-started", "title": "Getting Started" }
  ],
  "resources": [],
  "lessons": [
    {
      "id": "001-welcome",
      "num": "001",
      "title": "Welcome",
      "categoryId": "getting-started",
      "category": "Getting Started",
      "video": "videos/001-welcome.mp4"
    }
  ]
}
```

**Rules:**

- Only set `video` if the file exists under `<course-id>/`.
- Notes-only lessons: omit `video`.
- `duration`: set if known (seconds); otherwise omit — do not invent precise lengths.
- Preserve lesson array order as curriculum order.
- Keep lesson `id`s **stable** (progress is stored by lesson id in the browser).

Optional **`resources`** (sidebar Files tab):

```json
"resources": [
  {
    "id": "cheatsheet",
    "title": "Course cheatsheet",
    "path": "assets/cheatsheet.pdf",
    "description": "Printable reference",
    "group": "Reference"
  }
]
```

### 6. Write notes (optional)

One Markdown file per lesson, named after the lesson id:

```bash
mkdir -p <course-id>/notes
```

```text
<course-id>/notes/001-welcome.md
```

```md
## Welcome

Markdown notes for this lecture…
```

- Filename stem **must** match `lessons[].id` (`001-welcome.md` → lesson `001-welcome`).
- Notes-only lessons: omit `video` in `course.json` and still add `notes/<id>.md`.
- If there are no notes, **omit** the `notes/` folder (do not leave an empty stub).

### 7. No app registration

Do **not** edit CourseDesk app source or maintain a shared catalog.
Drop the folder here and **Rescan** in the player.

### 8. Verify

- [ ] `<course-id>/course.json` is valid JSON with a `lessons` array
- [ ] Folder name === `id`
- [ ] Every `lesson.video` file exists
- [ ] Every `lesson.categoryId` exists in `categories`
- [ ] Lesson ids unique; each `notes/<id>.md` stem is a real lesson id
- [ ] Library card appears after Rescan; video / notes play

---

## Updating an existing course

1. Do **not** recreate the id/folder unless the user wants a new course.
2. Add new videos to `videos/` and notes to `notes/<lesson-id>.md`; extend `lessons[]` and categories as needed.
3. Keep existing lesson `id`s stable.
4. Only renumber display `num` / titles if the user asks; avoid changing ids.

---

## What not to do

- Do not invent video filenames or precise durations.
- Do not leave an empty `notes/` folder if there are no notes — omit it.
- Do not put course details in the CourseDesk app source.
- Do not nest courses more than one level deep under this root.
- Do not write `course.js` or `notes.js`. CourseDesk only reads `course.json` and `notes/<lesson-id>.md`.

---

## Summary for agents

```text
User media → <this-folder>/<id>/{videos,assets}/
Notes      → <this-folder>/<id>/notes/<lesson-id>.md
Metadata   → <this-folder>/<id>/course.json  ONLY
Discovery  → automatic (CourseDesk Rescan / reload)
Never      → course details in app source or a shared catalog
```
