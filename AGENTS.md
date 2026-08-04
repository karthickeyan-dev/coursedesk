# CourseDesk — notes for AI agents

## Repo layout

| Path | Tracked? | Role |
|------|----------|------|
| `index.html`, `css/`, `js/`, `fonts/` | yes | CourseDesk player app (ES modules in `js/`) |
| `course-template/` | yes | Starter package + packaging guide |
| `courses/` | **no** (gitignored) | Local course content: videos, notes, catalog |

## Adding or structuring a course

When the user uploads videos/assets or asks to set up a course:

1. Read **`course-template/AGENTS.md`** (authoritative packaging guide).
2. Copy the template into `courses/<course-id>/` (never turn the template into the live course).
3. Place media under `videos/` and `assets/`, write `course.js` (+ optional `notes.js`).
4. Register in `courses/catalog.js` and load scripts from `index.html`.

## Do not

- Commit large media under `courses/`
- Overwrite `course-template/` with production content
- Change lesson `id`s on existing courses without being asked (progress is keyed by id)
