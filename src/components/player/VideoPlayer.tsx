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
  }, [activeCourse, videoPath, activeLessonId]);

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

  const prevLessonRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevLessonRef.current && prevLessonRef.current !== activeLessonId) {
      api.persistTimeNow();
    }
    prevLessonRef.current = activeLessonId;

    if (!src || !activeCourse || !activeLessonId) {
      api.hideVideo();
      return;
    }

    const startTime = Storage.loadLessonTime(activeCourse.data.id, activeLessonId);
    api.showVideo(src, { startTime });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to lesson/src changes
  }, [src, activeLessonId, activeCourse?.data.id]);

  if (!lesson) return null;

  if (!videoPath) {
    return (
      <section className="player-stage hidden" aria-label="Lecture video" />
    );
  }

  if (!src) {
    return (
      <section className="player-stage" aria-label="Lecture video">
        <div className="player-wrap player-loading">
          <p className="player-loading-text">Loading video…</p>
        </div>
      </section>
    );
  }

  return (
    <section className="player-stage" ref={stageRef} aria-label="Lecture video">
      <div className="player-wrap">
        <video
          ref={videoRef}
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

/** Expose active video check for app hotkeys (F = complete when no video). */
export function useHasActiveVideo(): boolean {
  const activeLessonId = useAppStore((s) => s.activeLessonId);
  const lessonsById = useAppStore((s) => s.lessonsById);
  const lesson = activeLessonId ? lessonsById[activeLessonId] : null;
  return Boolean(lesson?.video);
}
