# CourseDesk — agent guide

Notes for AI agents and contributors working on **this repository** (the player app).

For packaging **course content** on disk, use `COURSE_TEMPLATE.md` inside the user’s linked courses folder — not this file. The canonical guide lives at `public/COURSE_TEMPLATE.md` and is written/downloaded by the app.

---

## What this project is

- **Static SPA** course player (library, video, notes, curriculum, progress).
- Courses load **only** from a user-selected local folder (File System Access API).
- There is **no** HTTP course server, no `courses/` tree in the repo, no `course-template/` folder.
- Progress and prefs: `localStorage`. Folder handle: **IndexedDB**.

---

## Stack

| Layer | Choice |
|-------|--------|
| Tooling | Vite 6, TypeScript, **pnpm** |
| UI | React 19, Zustand |
| Styles | Tailwind v4 utilities + `src/styles/styles.css` (tokens, prose, player ranges) |
| Notes | `marked` + `highlight.js` |
| Icons | `lucide-react` |
| Courses | `src/lib/local-courses.ts` + `course-loader.ts` |

### Commands

```bash
pnpm install
pnpm start          # dev
pnpm build          # dist/
pnpm lint           # Biome lint
pnpm lint:fix      # Biome lint --write
pnpm typecheck      # tsc --noEmit
pnpm check          # lint + typecheck
pnpm test
```

---

## Source map

```text
src/
  components/
    library/       # course grid, empty / first-run states
    lesson/        # lecture bar, notes
    curriculum/    # sidebar content + files
    player/        # video + controls
    layout/        # topbar, settings, progress
  store/           # Zustand (useAppStore), boot, selectors
  lib/
    local-courses.ts          # folder pick, scan, scripts, blob URLs
    fs-handle-store.ts        # IndexedDB for FileSystemDirectoryHandle
    course-loader.ts          # boot / select / rescan / clear flows
    course-packaging-guide.ts # filename + load/download helpers
public/
  COURSE_TEMPLATE.md          # packaging guide (static asset)
    storage.ts                # coursedesk.* localStorage only
    assets.ts                 # resolveCourseAssetUrl, library helpers
    notes.ts, format.ts
  styles/styles.css
  types/course.ts
netlify.toml                  # static deploy + SPA redirect
```

---

## Architecture rules

### Courses

1. **Never** hardcode course ids or curricula in app source.
2. Packages are IIFE scripts that set `window.COURSES` / `window.COURSE_NOTES`. **Never** `import()` `course.js`.
3. Load path: pick/restore folder → scan children with `course.js` → eval via blob script tags → `buildAvailableCourses()`.
4. Media: `resolveCourseAssetUrl` → local `blob:` URLs. Lazy cache; revoke on rescan/unlink.
5. Keep lesson `id`s stable — they are progress keys.

### State & storage

| Concern | Module |
|---------|--------|
| Progress, theme, sidebar, active course | `lib/storage.ts` only (`coursedesk.*` keys) |
| Directory handle | `lib/fs-handle-store.ts` (IndexedDB) |
| UI state / actions | `store/useAppStore.ts` |
| Derived progress stats | `store/selectors.ts` — **not** from the store module |
| Boot / apply load results | `store/boot.ts` |

### UI conventions

- Import path helpers from `lib/assets` / `lib/format`, not the store.
- ProgressPill must use `useShallow(selectProgressStats)` (React 19 snapshot stability).
- **Topbar** uses always-dark `--tb-*` tokens; **page** uses theme tokens (`--bg`, `--text`, …). Do not put body text colors on topbar chrome.
- Dark/light: toggle `data-theme` on `<html>`; keep contrast consistent.

### Do not

- Serve or fetch `/courses/*` from the app.
- Open the app via `file://`.
- Write `coursedesk.*` localStorage outside `storage.ts`.
- Add a monorepo `courses/` or `course-template/` dependency for the player to work.
- Invent video filenames or durations when packaging content (that’s content work — follow `COURSE_TEMPLATE.md` on disk).

---

## Product flows (when changing boot / settings)

| Flow | Entry |
|------|--------|
| First visit / no folder | Empty state → `selectAndLoadCoursesFolder` |
| Return visit | `bootLocalCourses` → restore handle → load or `needs-permission` |
| Rescan | Settings / empty state → `rescanCoursesFolder` |
| Packaging guide | `public/COURSE_TEMPLATE.md` → write/download via `local-courses` |

Permission re-grant often needs a **user gesture** (`requestPermission`).

---

## Deploy notes

- Build is static (`dist/`). Host only the UI.
- SPA fallback required (`netlify.toml` / `public/_redirects`).
- Folder handles are per **origin**; production and localhost do not share them.

---

## Tests

- Unit tests: `src/__tests__/` (storage, format).
- Prefer pure functions in `lib/` for new testable logic.
- Manual smoke: pick folder → open course → seek video → toggle theme → rescan.

---

## When packaging a course (content, not this repo)

The user’s courses root (chosen in the app) is the workspace. Follow **`COURSE_TEMPLATE.md`** there:

```text
<courses-root>/<course-id>/course.js   (+ notes.js, videos/, assets/)
```

Then **Rescan** in CourseDesk. Do not edit player source to register a course.
