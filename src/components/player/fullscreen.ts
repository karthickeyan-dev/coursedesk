/** Cross-browser fullscreen helpers for the video stage. */

export function getFullscreenElement(): Element | null {
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
    mozFullScreenElement?: Element | null;
    msFullscreenElement?: Element | null;
  };
  return (
    document.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement ||
    null
  );
}

export function requestFullscreen(element: HTMLElement): Promise<void> {
  const el = element as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
    webkitRequestFullScreen?: () => Promise<void> | void;
    mozRequestFullScreen?: () => Promise<void> | void;
    msRequestFullscreen?: () => Promise<void> | void;
    webkitEnterFullscreen?: () => void;
  };
  if (el.requestFullscreen) return el.requestFullscreen();
  if (el.webkitRequestFullscreen) return Promise.resolve(el.webkitRequestFullscreen());
  if (el.webkitRequestFullScreen) return Promise.resolve(el.webkitRequestFullScreen());
  if (el.mozRequestFullScreen) return Promise.resolve(el.mozRequestFullScreen());
  if (el.msRequestFullscreen) return Promise.resolve(el.msRequestFullscreen());
  if (el.webkitEnterFullscreen) {
    el.webkitEnterFullscreen();
    return Promise.resolve();
  }
  return Promise.reject(new Error("Fullscreen API not available"));
}

export function exitFullscreen(): Promise<void> {
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void> | void;
    webkitCancelFullScreen?: () => Promise<void> | void;
    mozCancelFullScreen?: () => Promise<void> | void;
    msExitFullscreen?: () => Promise<void> | void;
  };
  if (document.exitFullscreen) return document.exitFullscreen();
  if (doc.webkitExitFullscreen) return Promise.resolve(doc.webkitExitFullscreen());
  if (doc.webkitCancelFullScreen) return Promise.resolve(doc.webkitCancelFullScreen());
  if (doc.mozCancelFullScreen) return Promise.resolve(doc.mozCancelFullScreen());
  if (doc.msExitFullscreen) return Promise.resolve(doc.msExitFullscreen());
  return Promise.resolve();
}
