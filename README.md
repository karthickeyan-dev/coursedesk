# CourseDesk

A **local-first course player** for self-paced video courses. The app runs in the browser (or on Netlify); your course folders and videos stay on your computer.

- Pick a courses folder once — CourseDesk remembers it
- Progress is saved in the browser
- No upload of videos or course media
- Optional packaging guide (`COURSE_TEMPLATE.md`) for you or an AI when adding courses

## Requirements

| | |
|--|--|
| **Browser** | Chrome or Edge on desktop ([File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)) |
| **Context** | `http://localhost` or **HTTPS** (not `file://`) |
| **Node** | ≥ 18 (for developing / building the app) |
| **Package manager** | pnpm ≥ 9 |

## Quick start

```bash
pnpm install
pnpm start
```

1. Open the app (default `http://localhost:5173`).
2. Choose your **courses folder** (the directory that contains one subfolder per course).
3. Open a course and learn. Progress is stored automatically.

| Command | Purpose |
|---------|---------|
| `pnpm start` / `pnpm dev` | Development server |
| `pnpm build` | Production build → `dist/` |
| `pnpm preview` | Serve the production build locally |
| `pnpm lint` | Biome lint |
| `pnpm lint:fix` | Biome lint with auto-fix |
| `pnpm typecheck` | TypeScript check |
| `pnpm check` | Lint + typecheck |
| `pnpm test` | Unit tests |

## Deploy (static host)

CourseDesk is a static SPA. Only the **player UI** is hosted; media never leaves the user’s machine.

```bash
pnpm build
```

Deploy the `dist/` folder. This repo includes `netlify.toml` (build command + SPA fallback). Any static host works (Netlify, Cloudflare Pages, S3 + CDN, etc.) as long as:

- The site is served over **HTTPS**
- Unknown routes fall back to `index.html` (SPA)

On first visit after deploy, the user selects their local courses folder again (handles are per origin).

## Courses folder layout

Select the **root** folder that holds course packages:

```text
<courses-root>/
  COURSE_TEMPLATE.md     # packaging guide (auto-written on first pick)
  my-course/
    course.json          # required — curriculum + metadata
    notes/               # optional — one Markdown file per lesson
      001-welcome.md
    videos/              # lecture media
    assets/              # PDFs, images, downloads, …
  another-course/
    course.json
    videos/
```

**Discovery:** any **immediate child** of the root that contains `course.json` is a course. (A legacy `course.js` still loads if JSON is missing.)

**After adding or editing a package on disk:** Settings → **Rescan folder** (or reload the page once access is already granted).

### Packaging with AI

1. Link the courses folder in CourseDesk (writes `COURSE_TEMPLATE.md` if missing).
2. Open that same folder in your editor.
3. Point the agent at `COURSE_TEMPLATE.md` plus the new videos/assets.
4. Rescan in CourseDesk when packaging is done.

If the guide file was deleted: **Settings → Save packaging guide** (or **Download packaging guide** if write permission is unavailable).

## Settings

| Action | Purpose |
|--------|---------|
| Choose / Change folder | Pick or replace the courses root |
| Allow access | Re-grant browser permission when needed |
| Rescan folder | Reload packages from disk |
| Save packaging guide | Write `COURSE_TEMPLATE.md` into the folder |
| Download packaging guide | Get the guide as a file without write access |
| Clear folder link | Forget the linked folder |

## Theme

Light and dark modes for page content. The top bar stays dark in both (e-learning chrome).

## Stack

Vite · React 19 · TypeScript · Zustand · CSS design tokens · marked · highlight.js · lucide-react

For contributor / agent conventions, see [AGENTS.md](./AGENTS.md).
