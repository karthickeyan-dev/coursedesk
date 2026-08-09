import { useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

/**
 * Solid circular edge control — avoid shadcn ghost (transparent hover).
 * Edge sits fully on the sidebar so main's scrollbar stays free.
 */
const sidebarToggleClass = [
  "z-30 grid size-8 shrink-0 place-items-center rounded-full",
  "border border-border bg-elevated text-text shadow-md",
  "hover:bg-panel-2 hover:text-text active:bg-panel-2",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
  "transition-colors duration-150",
].join(" ");

function SidebarToggle({
  open,
  onToggle,
  placement,
}: {
  open: boolean;
  onToggle: () => void;
  /** `edge` = on open sidebar tab bar; `rail` = when collapsed */
  placement: "edge" | "rail";
}) {
  return (
    <button
      type="button"
      className={cn(
        sidebarToggleClass,
        // Centered on the Content / Files tab row; keep inside sidebar
        // so it never covers the lesson (video/notes) scrollbar
        placement === "edge" && "absolute top-1/2 left-2 -translate-y-1/2",
        // Inset from the viewport edge so it clears the main scrollbar
        placement === "rail" &&
          "fixed top-[calc(var(--spacing-topbar)+1.4rem)] right-4 -translate-y-1/2"
      )}
      title={open ? "Collapse course content" : "Expand course content"}
      aria-label={open ? "Collapse course content" : "Expand course content"}
      aria-expanded={open}
      onClick={onToggle}
    >
      {open ? (
        <ChevronRight className="size-4" strokeWidth={2.25} aria-hidden />
      ) : (
        <ChevronLeft className="size-4" strokeWidth={2.25} aria-hidden />
      )}
    </button>
  );
}

function CurriculumPanel({
  className,
  onCollapse,
}: {
  className?: string;
  /** Desktop collapse control, pinned to the tab bar midline */
  onCollapse?: () => void;
}) {
  const categories = useAppStore((s) => s.categories);
  const lessons = useAppStore((s) => s.lessons);
  const sidebarTab = useAppStore((s) => s.sidebarTab);
  const setSidebarTab = useAppStore((s) => s.setSidebarTab);
  const activeCourse = useAppStore((s) => s.activeCourse);
  const activeLessonId = useAppStore((s) => s.activeLessonId);

  const resources = activeCourse?.data?.resources;
  const hasFiles = Array.isArray(resources) && resources.length > 0;
  const tab =
    hasFiles && sidebarTab === "files" ? "files" : "content";

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

  // Leave Files if the course has no resources
  useEffect(() => {
    if (!hasFiles && sidebarTab === "files") {
      setSidebarTab("content");
    }
  }, [hasFiles, sidebarTab, setSidebarTab]);

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
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col bg-elevated",
        className
      )}
    >
      <Tabs
        value={tab}
        onValueChange={(value) =>
          setSidebarTab(value === "files" ? "files" : "content")
        }
        className="flex min-h-0 w-full flex-1 flex-col gap-0"
      >
        <div className="relative shrink-0">
          {onCollapse ? (
            <SidebarToggle open placement="edge" onToggle={onCollapse} />
          ) : null}
          <TabsList
            className={cn(
              "h-auto w-full justify-start rounded-none border-b border-border bg-elevated p-0 px-3",
              // Room for the circular collapse control on the tab bar
              onCollapse && "pl-12"
            )}
          >
            <TabsTrigger
              value="content"
              className="rounded-none border-0 border-b-2 border-transparent px-3.5 py-3 text-[0.88rem] font-semibold shadow-none data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:text-text data-[state=active]:shadow-none"
            >
              Content
            </TabsTrigger>
            {hasFiles ? (
              <TabsTrigger
                value="files"
                className="rounded-none border-0 border-b-2 border-transparent px-3.5 py-3 text-[0.88rem] font-semibold shadow-none data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:text-text data-[state=active]:shadow-none"
              >
                Files
              </TabsTrigger>
            ) : null}
          </TabsList>
        </div>
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
        {hasFiles ? (
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
        ) : null}
      </Tabs>
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
      <div className="pointer-events-none fixed inset-0 z-30">
        {!open && (
          <div className="pointer-events-auto">
            <SidebarToggle
              open={false}
              placement="rail"
              onToggle={() => setCurriculumOpen(true)}
            />
          </div>
        )}
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
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative min-h-0 min-w-0",
        collapsed
          ? "w-0 overflow-visible"
          : "flex w-(--spacing-sidebar) max-w-full flex-col"
      )}
    >
      {collapsed ? (
        <SidebarToggle
          open={false}
          placement="rail"
          onToggle={() => setCurriculumOpen(true)}
        />
      ) : (
        <aside
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-visible border-l border-border bg-elevated"
          aria-label="Course sidebar"
        >
          <CurriculumPanel onCollapse={() => setCurriculumOpen(false)} />
        </aside>
      )}
    </div>
  );
}
