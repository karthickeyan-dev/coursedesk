import { useEffect, useMemo } from "react";
import { useAppStore } from "../../store/useAppStore";
import { CategorySection } from "./CategorySection";
import { FilesPanel } from "./FilesPanel";

export function CurriculumSidebar({ collapsed }: { collapsed?: boolean }) {
  const categories = useAppStore((s) => s.categories);
  const lessons = useAppStore((s) => s.lessons);
  const sidebarTab = useAppStore((s) => s.sidebarTab);
  const setSidebarTab = useAppStore((s) => s.setSidebarTab);
  const activeCourse = useAppStore((s) => s.activeCourse);
  const activeLessonId = useAppStore((s) => s.activeLessonId);

  const resources = activeCourse?.data?.resources;
  const hasFiles = Array.isArray(resources) && resources.length > 0;
  const isContent = sidebarTab === "content" || !hasFiles;

  const lessonsByCategory = useMemo(() => {
    const map = new Map<string, typeof lessons>();
    for (const lesson of lessons) {
      const list = map.get(lesson.categoryId) || [];
      list.push(lesson);
      map.set(lesson.categoryId, list);
    }
    return map;
  }, [lessons]);

  useEffect(() => {
    if (!activeLessonId) return;
    requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(`[data-lesson-id="${activeLessonId}"]`)
        ?.scrollIntoView({ block: "nearest" });
    });
  }, [activeLessonId]);

  return (
    <aside
      className={[
        "flex min-h-0 min-w-0 flex-col border-l border-border bg-elevated transition-opacity duration-150",
        collapsed
          ? "w-0 min-w-0 overflow-hidden border-0 opacity-0 pointer-events-none"
          : "w-(--spacing-sidebar) max-w-full max-[979px]:absolute max-[979px]:inset-y-0 max-[979px]:right-0 max-[979px]:z-30 max-[979px]:shadow-[-8px_0_24px_rgba(0,0,0,0.25)]",
      ].join(" ")}
      aria-label="Course sidebar"
      aria-hidden={collapsed}
    >
      <div
        className={[
          "flex shrink-0 gap-0 border-b border-border bg-elevated px-3",
          !hasFiles ? "hidden" : "",
        ].join(" ")}
        role="tablist"
        aria-label="Sidebar panels"
      >
        <button
          type="button"
          className={[
            "-mb-px appearance-none rounded-none border-0 border-b-2 bg-transparent px-3.5 py-3 text-[0.88rem] font-semibold",
            isContent
              ? "border-accent text-text"
              : "border-transparent text-muted hover:text-text",
          ].join(" ")}
          role="tab"
          aria-selected={isContent}
          aria-controls="panelContent"
          onClick={() => setSidebarTab("content")}
        >
          Content
        </button>
        {hasFiles && (
          <button
            type="button"
            className={[
              "-mb-px appearance-none rounded-none border-0 border-b-2 bg-transparent px-3.5 py-3 text-[0.88rem] font-semibold",
              !isContent
                ? "border-accent text-text"
                : "border-transparent text-muted hover:text-text",
            ].join(" ")}
            role="tab"
            aria-selected={!isContent}
            aria-controls="panelFiles"
            onClick={() => setSidebarTab("files")}
          >
            Files
          </button>
        )}
      </div>
      <div
        id="panelContent"
        className={[
          "min-h-0 flex-1 flex-col overflow-hidden",
          isContent ? "flex" : "hidden",
        ].join(" ")}
        role="tabpanel"
        hidden={!isContent}
      >
        <nav className="min-h-0 flex-1 overflow-auto [scrollbar-gutter:stable]">
          {categories.map((category, index) => {
            const catLessons = lessonsByCategory.get(category.id) || [];
            if (!catLessons.length) return null;
            return (
              <CategorySection
                key={category.id}
                category={category}
                sectionNumber={index + 1}
                lessons={catLessons}
              />
            );
          })}
        </nav>
      </div>
      {hasFiles && (
        <div
          id="panelFiles"
          className={[
            "min-h-0 flex-1 flex-col overflow-hidden",
            !isContent ? "flex" : "hidden",
          ].join(" ")}
          role="tabpanel"
          hidden={isContent}
        >
          <FilesPanel />
        </div>
      )}
    </aside>
  );
}
