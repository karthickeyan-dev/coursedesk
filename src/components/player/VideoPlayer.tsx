import { useEffect, useRef, useState } from "react";
import { resolveCourseAssetUrl } from "@/lib/assets";
import * as Storage from "@/lib/storage";
import { useAppStore } from "@/store/useAppStore";
import { PlayerControls } from "./PlayerControls";
import { PlayerHud } from "./PlayerHud";
import { useVideoPlayer } from "./useVideoPlayer";

export function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLElement>(null);

  const activeCourse = useAppStore((s) => s.activeCourse);
  const activeLessonId = useAppStore((s) => s.activeLessonId);
  const lessonsById = useAppStore((s) => s.lessonsById);

  const lesson = activeLessonId ? lessonsById[activeLessonId] : null;
  const videoPath = lesson?.video;
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSrc(null);
    if (!activeCourse || !videoPath) return;
    void resolveCourseAssetUrl(activeCourse, videoPath).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [activeCourse, videoPath]);

  const loadedCourseIdRef = useRef<string | null>(null);
  const loadedLessonIdRef = useRef<string | null>(null);

  const api = useVideoPlayer({
    videoRef,
    stageRef,
    enabled: Boolean(src),
    onTimePersist: (seconds) => {
      const courseId = loadedCourseIdRef.current;
      const lessonId = loadedLessonIdRef.current;
      if (!courseId || !lessonId) return;
      Storage.saveLessonTime(courseId, lessonId, seconds);
    },
    onEnded: () => {
      useAppStore.getState().onActiveLessonEnded();
    },
  });

  const { persistTimeNow, hideVideo, showVideo } = api;

  useEffect(() => {
    const prevCourseId = loadedCourseIdRef.current;
    const prevLessonId = loadedLessonIdRef.current;

    if (
      prevCourseId &&
      prevLessonId &&
      (prevCourseId !== activeCourse?.data.id || prevLessonId !== activeLessonId)
    ) {
      persistTimeNow();
    }

    if (!src || !activeCourse || !activeLessonId) {
      hideVideo();
      return;
    }

    const switchingLesson =
      loadedLessonIdRef.current !== activeLessonId ||
      loadedCourseIdRef.current !== activeCourse.data.id;
    const attachedSrc = videoRef.current?.getAttribute("src") ?? "";
    // Lesson changed but this blob URL still belongs to the previous lecture.
    if (switchingLesson && attachedSrc && attachedSrc === src) {
      return;
    }

    loadedCourseIdRef.current = activeCourse.data.id;
    loadedLessonIdRef.current = activeLessonId;

    const startTime = Storage.loadLessonTime(activeCourse.data.id, activeLessonId);
    const pendingId = useAppStore.getState().pendingAutoplayLessonId;
    const autoplay = pendingId === activeLessonId;
    if (autoplay) useAppStore.getState().clearPendingAutoplay();
    showVideo(src, { startTime, autoplay });
  }, [src, activeLessonId, activeCourse, persistTimeNow, hideVideo, showVideo]);

  if (!lesson || !videoPath) return null;

  if (!src) {
    return (
      <section className="flex w-full flex-col bg-black" aria-label="Lecture video">
        <div className="grid min-h-[200px] place-items-center bg-black text-[#d1d7dc]">
          <p className="m-0 text-[0.9rem]">Loading video…</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="player-stage flex w-full flex-col bg-black"
      ref={stageRef}
      aria-label="Lecture video"
    >
      <div className="player-wrap relative mx-auto grid aspect-video w-full max-w-[1200px] shrink-0 place-items-center bg-black">
        <video
          ref={videoRef}
          className="block h-full w-full cursor-pointer bg-black object-contain"
          preload="metadata"
          playsInline
          onClick={() => api.togglePlayPause(false)}
          onDoubleClick={(e) => {
            e.preventDefault();
            api.toggleFullscreen(false);
          }}
        />
        <PlayerHud hud={api.ui.hud} />
      </div>
      <PlayerControls ui={api.ui} api={api} />
    </section>
  );
}

export function useHasActiveVideo(): boolean {
  const activeLessonId = useAppStore((s) => s.activeLessonId);
  const lessonsById = useAppStore((s) => s.lessonsById);
  const lesson = activeLessonId ? lessonsById[activeLessonId] : null;
  return Boolean(lesson?.video);
}
