import { useEffect, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaQuery } from "@/lib/use-media-query";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { CategorySection } from "./CategorySection";
import { FilesPanel } from "./FilesPanel";

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
    <nav className="min-h-0 flex-1">
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
      {hasFiles ? (
        <Tabs
          value={tab}
          onValueChange={(value) =>
            setSidebarTab(value === "files" ? "files" : "content")
          }
          className="flex min-h-0 w-full flex-1 flex-col gap-0"
        >
          <TabsList className="h-auto w-full justify-start rounded-none border-b border-border bg-elevated p-0 px-3">
            <TabsTrigger
              value="content"
              className="rounded-none border-0 border-b-2 border-transparent px-3.5 py-3 text-[0.88rem] font-semibold shadow-none data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:text-text data-[state=active]:shadow-none"
            >
              Content
            </TabsTrigger>
            <TabsTrigger
              value="files"
              className="rounded-none border-0 border-b-2 border-transparent px-3.5 py-3 text-[0.88rem] font-semibold shadow-none data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:text-text data-[state=active]:shadow-none"
            >
              Files
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="content"
            className="mt-0 min-h-0 w-full flex-1 overflow-hidden data-[state=inactive]:hidden"
          >
            <ScrollArea className="h-full w-full">
              <div className="w-full min-w-full [scrollbar-gutter:stable]">
                {contentNav}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent
            value="files"
            className="mt-0 min-h-0 w-full flex-1 overflow-hidden data-[state=inactive]:hidden"
          >
            <ScrollArea className="h-full w-full">
              <div className="w-full min-w-full [scrollbar-gutter:stable]">
                <FilesPanel />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ScrollArea className="h-full">
            <div className="[scrollbar-gutter:stable]">{contentNav}</div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

export function CurriculumSidebar({ collapsed }: { collapsed?: boolean }) {
  const isNarrow = useMediaQuery("(max-width: 979px)");
  const curriculumOpen = useAppStore((s) => s.curriculumOpen);
  const setCurriculumOpen = useAppStore((s) => s.setCurriculumOpen);
  const open = !collapsed && curriculumOpen;

  if (isNarrow) {
    return (
      <Sheet open={open} onOpenChange={setCurriculumOpen}>
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

  return (
    <aside
      className={cn(
        "flex min-h-0 min-w-0 flex-col border-l border-border bg-elevated transition-opacity duration-150",
        collapsed
          ? "pointer-events-none w-0 min-w-0 overflow-hidden border-0 opacity-0"
          : "w-(--spacing-sidebar) max-w-full"
      )}
      aria-label="Course sidebar"
      aria-hidden={collapsed}
    >
      <CurriculumPanel />
    </aside>
  );
}
