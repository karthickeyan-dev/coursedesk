import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { courseDeskCourses } from "./plugins/vite-plugin-courses";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss(), courseDeskCourses()],
  publicDir: "public",
  server: {
    port: 5173,
    strictPort: false,
    open: true,
    watch: {
      ignored: [
        "**/courses/**/videos/**",
        "**/courses/**/assets/**",
        "**/node_modules/**",
      ],
    },
    fs: {
      allow: [root],
    },
  },
  preview: {
    port: 4173,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
  },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
