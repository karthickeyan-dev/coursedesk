import { useEffect, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { CategorySection } from "./CategorySection";
import { FilesPanel } from "./FilesPanel";

const tabTriggerClass =
  "rounded-none border-0 border-b-2 border-transparent px-3.5 py-3 text-[0.88rem] font-semibold shadow-none data-active:border-accent data-active:bg-transparent data-active:text-text data-active:shadow-none";

function CurriculumPanel({ className }: { className?: string }) {
  const categories = useAppStore((s) => s.categories);
  const lessons = useAppStore((s) => s.lessons);
  const sidebarTab = useAppStore((s) => s.sidebarTab);
  const setSidebarTab = useAppStore((s) => s.setSidebarTab);
  const activeCourse = useAppStore((s) => s.activeCourse);
  const activeLessonId = useAppStore((s) => s.activeLessonId);

  const resources = activeCourse?.data?.resources;
  const hasFiles = Array.isArray(resources) && resources.length > 0;
  const tab = hasFiles && sidebarTab === "files" ? "files" : "content";

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

  const contentNav = (
    <nav className="block w-full min-w-0">
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
  );

  return (
    <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col bg-elevated", className)}>
      <Tabs
        value={tab}
        onValueChange={(value) => setSidebarTab(value === "files" ? "files" : "content")}
        className="flex min-h-0 w-full flex-1 flex-col gap-0"
      >
        <div className="relative shrink-0">
          <TabsList className="h-auto w-full justify-start rounded-none border-b border-border bg-elevated p-0 px-3">
            <TabsTrigger value="content" className={tabTriggerClass}>
              Content
            </TabsTrigger>
            {hasFiles ? (
              <TabsTrigger value="files" className={tabTriggerClass}>
                Files
              </TabsTrigger>
            ) : null}
          </TabsList>
        </div>
        <TabsContent
          value="content"
          className="mt-0 min-h-0 w-full flex-1 overflow-hidden data-hidden:hidden"
        >
          <ScrollArea className="h-full w-full">
            <div className="w-full min-w-full [scrollbar-gutter:stable]">{contentNav}</div>
          </ScrollArea>
        </TabsContent>
        {hasFiles ? (
          <TabsContent
            value="files"
            className="mt-0 min-h-0 w-full flex-1 overflow-hidden data-hidden:hidden"
          >
            <ScrollArea className="h-full w-full">
              <div className="w-full min-w-full [scrollbar-gutter:stable]">
                <FilesPanel />
              </div>
            </ScrollArea>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}

export function CurriculumSidebar() {
  const isNarrow = useMediaQuery("(max-width: 979px)");
  const curriculumOpen = useAppStore((s) => s.curriculumOpen);
  const setCurriculumOpen = useAppStore((s) => s.setCurriculumOpen);

  if (isNarrow) {
    return (
      <Sheet open={curriculumOpen} onOpenChange={setCurriculumOpen}>
        <SheetContent
          side="right"
          className="flex w-(--spacing-sidebar) max-w-[min(22.5rem,92vw)] flex-col gap-0 border-l border-border bg-elevated p-0 sm:max-w-[min(22.5rem,92vw)]"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Course content</SheetTitle>
          </SheetHeader>
          <CurriculumPanel className="min-h-0 flex-1" />
        </SheetContent>
      </Sheet>
    );
  }

  if (!curriculumOpen) return null;

  return (
    <div className="relative flex min-h-0 min-w-0 w-(--spacing-sidebar) max-w-full flex-col">
      <aside
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-l border-border bg-elevated"
        aria-label="Course sidebar"
      >
        <CurriculumPanel />
      </aside>
    </div>
  );
}
