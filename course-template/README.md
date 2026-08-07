# CourseDesk course template

Tracked starter package for CourseDesk. **Copy** this folder into `courses/<course-id>/` when adding a real course — do not fill this template with production videos.

| File | Purpose |
|------|---------|
| `AGENTS.md` | Full AI/human guide: how to structure courses from raw videos & assets |
| `course.js` | Curriculum schema sample (title, author, lessons, resources) |
| `notes.js` | Optional Markdown notes sample |
| `videos/` | Placeholder for lecture media |
| `assets/` | Placeholder for images, PDFs, downloads |

Real courses live under `../courses/` (gitignored). See `AGENTS.md` for the packaging workflow.

**No registration step:** with `pnpm start`, the player loads every `courses/<id>/course.js` automatically. Do not edit `index.html` for new courses.
