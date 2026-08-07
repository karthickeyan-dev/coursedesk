/**
 * Live course discovery + static /courses/* (videos need Range support via sirv).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Connect, Plugin, PreviewServer, ViteDevServer } from "vite";
import sirv from "sirv";

const coursesDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "courses"
);

export interface CourseManifestEntry {
  id: string;
  hasNotes: boolean;
}

export function discoverCourses(dir = coursesDir): CourseManifestEntry[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((id) => fs.existsSync(path.join(dir, id, "course.js")))
    .sort()
    .map((id) => ({
      id,
      hasNotes: fs.existsSync(path.join(dir, id, "notes.js")),
    }));
}

function attach(server: { middlewares: Connect.Server }): void {
  // Manifest first (before static)
  server.middlewares.use((req, res, next) => {
    const url = (req.url || "").split("?")[0];
    if (url === "/courses/manifest.json") {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.end(
        JSON.stringify({
          generatedAt: new Date().toISOString(),
          courses: discoverCourses(),
        })
      );
      return;
    }
    next();
  });

  // Static course packages (sirv handles Range for video seek)
  server.middlewares.use(
    "/courses",
    sirv(coursesDir, {
      dev: true,
      etag: true,
      single: false,
    })
  );
}

export function courseDeskCourses(): Plugin {
  return {
    name: "coursedesk-courses",
    configureServer(server: ViteDevServer) {
      attach(server);
      const list = discoverCourses();
      server.httpServer?.once("listening", () => {
        setTimeout(() => {
          console.log(
            `\n  Courses (${list.length}): ${
              list.map((c) => c.id).join(", ") || "(none — add courses/<id>/)"
            }\n`
          );
        }, 0);
      });
    },
    configurePreviewServer(server: PreviewServer) {
      attach(server);
    },
  };
}
