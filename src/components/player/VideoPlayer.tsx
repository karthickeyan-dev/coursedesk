import { useEffect, useRef, useState } from "react";
import { resolveCourseAssetUrl } from "../../lib/assets";
import * as Storage from "../../lib/storage";
import { useAppStore } from "../../store/useAppStore";
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

  const api = useVideoPlayer({
    videoRef,
    stageRef,
    enabled: Boolean(src),
    onTimePersist: (seconds) => {
      const course = useAppStore.getState().activeCourse;
      const lessonId = useAppStore.getState().activeLessonId;
      if (!course || !lessonId) return;
      Storage.saveLessonTime(course.data.id, lessonId, seconds);
    },
  });

  const { persistTimeNow, hideVideo, showVideo } = api;
  const prevLessonRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevLessonRef.current && prevLessonRef.current !== activeLessonId) {
      persistTimeNow();
    }
    prevLessonRef.current = activeLessonId;

    if (!src || !activeCourse || !activeLessonId) {
      hideVideo();
      return;
    }

    const startTime = Storage.loadLessonTime(activeCourse.data.id, activeLessonId);
    showVideo(src, { startTime });
  }, [src, activeLessonId, activeCourse, persistTimeNow, hideVideo, showVideo]);

  if (!lesson) return null;

  if (!videoPath) {
    return (
      <section className="hidden w-full flex-col bg-black" aria-label="Lecture video" />
    );
  }

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
