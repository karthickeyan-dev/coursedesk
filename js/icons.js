/**
 * Icons used by the course player chrome.
 *
 * Media / player glyphs come from Lucide (ISC) — lucide-static v0.469.0.
 * https://lucide.dev
 */
(function (global) {
  "use strict";

  var ns = (global.CourseDesk = global.CourseDesk || {});

  /**
   * Official Lucide SVG shell (stroke icons).
   * @param {string} name Lucide icon slug (e.g. "play")
   * @param {string} children Inner SVG markup from lucide-static
   * @param {number} [size=24]
   * @param {string} [className=""] Extra classes (e.g. "icon-play")
   */
  function lucide(name, children, size, className) {
    var s = size == null ? 24 : size;
    var cls = ("lucide lucide-" + name + (className ? " " + className : "")).trim();
    var strokeOnly = {
      check: 1,
      maximize: 1,
      minimize: 1,
      "chevron-right": 1,
      file: 1,
      "file-text": 1,
      "file-code": 1,
      "file-type": 1,
      image: 1,
      film: 1,
      music: 1,
      type: 1,
      sun: 1,
      moon: 1,
      gauge: 1,
    };
    var fillMode = strokeOnly[name] ? "none" : "currentColor";
    return (
      '<svg class="' +
      cls +
      '" xmlns="http://www.w3.org/2000/svg" width="' +
      s +
      '" height="' +
      s +
      '" viewBox="0 0 24 24" fill="' + fillMode + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      children +
      "</svg>"
    );
  }

  /* Inner paths from lucide-static@0.469.0 (do not hand-draw). */
  var L = {
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    pause:
      '<rect x="14" y="4" width="4" height="16" rx="1"/>' +
      '<rect x="6" y="4" width="4" height="16" rx="1"/>',
    rewind:
      '<polygon points="11 19 2 12 11 5 11 19"/>' +
      '<polygon points="22 19 13 12 22 5 22 19"/>',
    "fast-forward":
      '<polygon points="13 19 22 12 13 5 13 19"/>' +
      '<polygon points="2 19 11 12 2 5 2 19"/>',
    "volume-2":
      '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/>' +
      '<path d="M16 9a5 5 0 0 1 0 6"/>' +
      '<path d="M19.364 18.364a9 9 0 0 0 0-12.728"/>',
    "volume-1":
      '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/>' +
      '<path d="M16 9a5 5 0 0 1 0 6"/>',
    "volume-x":
      '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/>' +
      '<line x1="22" x2="16" y1="9" y2="15"/>' +
      '<line x1="16" x2="22" y1="9" y2="15"/>',
    maximize:
      '<path d="M8 3H5a2 2 0 0 0-2 2v3"/>' +
      '<path d="M21 8V5a2 2 0 0 0-2-2h-3"/>' +
      '<path d="M3 16v3a2 2 0 0 0 2 2h3"/>' +
      '<path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
    minimize:
      '<path d="M8 3v3a2 2 0 0 1-2 2H3"/>' +
      '<path d="M21 8h-3a2 2 0 0 1-2-2V3"/>' +
      '<path d="M3 16h3a2 2 0 0 1 2 2v3"/>' +
      '<path d="M16 21v-3a2 2 0 0 1 2-2h3"/>',
    "skip-back":
      '<polygon points="19 20 9 12 19 4 19 20"/>' +
      '<line x1="5" x2="5" y1="19" y2="5"/>',
    "skip-forward":
      '<polygon points="5 4 15 12 5 20 5 4"/>' +
      '<line x1="19" x2="19" y1="5" y2="19"/>',
    gauge:
      '<path d="m12 14 4-4"/>' +
      '<path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    sun:
      '<circle cx="12" cy="12" r="4"/>' +
      '<path d="M12 2v2"/>' +
      '<path d="M12 20v2"/>' +
      '<path d="m4.93 4.93 1.41 1.41"/>' +
      '<path d="m17.66 17.66 1.41 1.41"/>' +
      '<path d="M2 12h2"/>' +
      '<path d="M20 12h2"/>' +
      '<path d="m6.34 17.66-1.41 1.41"/>' +
      '<path d="m19.07 4.93-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    "chevron-right": '<path d="m9 18 6-6-6-6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    /* File-type icons (lucide-static) for the Files panel */
    file:
      '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>' +
      '<path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
    "file-text":
      '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>' +
      '<path d="M14 2v4a2 2 0 0 0 2 2h4"/>' +
      '<path d="M10 9H8"/>' +
      '<path d="M16 13H8"/>' +
      '<path d="M16 17H8"/>',
    image:
      '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>' +
      '<circle cx="9" cy="9" r="2"/>' +
      '<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    film:
      '<rect width="18" height="18" x="3" y="3" rx="2"/>' +
      '<path d="M7 3v18"/>' +
      '<path d="M3 7.5h4"/>' +
      '<path d="M3 12h18"/>' +
      '<path d="M3 16.5h4"/>' +
      '<path d="M17 3v18"/>' +
      '<path d="M17 7.5h4"/>' +
      '<path d="M17 16.5h4"/>',
    music:
      '<path d="M9 18V5l12-2v13"/>' +
      '<circle cx="6" cy="18" r="3"/>' +
      '<circle cx="18" cy="16" r="3"/>',
    "file-code":
      '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>' +
      '<path d="M14 2v4a2 2 0 0 0 2 2h4"/>' +
      '<path d="m10 13-2 2 2 2"/>' +
      '<path d="m14 17 2-2-2-2"/>',
    "file-type":
      '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>' +
      '<path d="M14 2v4a2 2 0 0 0 2 2h4"/>' +
      '<path d="M9 13v-1h6v1"/>' +
      '<path d="M12 12v6"/>' +
      '<path d="M11 18h2"/>',
    type:
      '<polyline points="4 7 4 4 20 4 20 7"/>' +
      '<line x1="9" x2="15" y1="20" y2="20"/>' +
      '<line x1="12" x2="12" y1="4" y2="20"/>',
  };

  /**
   * @param {string} name Lucide slug
   * @param {number} [size=24]
   * @param {string} [className=""]
   */
  function lucideIcon(name, size, className) {
    var children = L[name];
    if (!children) return "";
    return lucide(name, children, size, className);
  }

  /** Semantic aliases used by the player HUD overlays. */
  var HUD = {
    play: "play",
    pause: "pause",
    seekBack: "rewind",
    seekForward: "fast-forward",
    volumeHigh: "volume-2",
    volumeLow: "volume-1",
    volumeMute: "volume-x",
    fullscreen: "maximize",
    exitFullscreen: "minimize",
    jumpStart: "skip-back",
    jumpEnd: "skip-forward",
    jump: "gauge",
  };

  var Icons = {
    lucide: lucideIcon,

    /** HUD overlay icon (36px Lucide stroke). */
    hud: function (key, size) {
      var name = HUD[key];
      return name ? lucideIcon(name, size == null ? 36 : size) : "";
    },

    sun: function () {
      return lucideIcon("sun", 18);
    },

    moon: function () {
      return lucideIcon("moon", 18);
    },

    chevron: function () {
      return lucideIcon("chevron-right", 16, "chev");
    },

    check: function () {
      return lucideIcon("check", 10);
    },

    /* Control-bar set (18px) — same Lucide glyphs as the HUD */
    play: function (className) {
      return lucideIcon("play", 18, className || "icon-play");
    },
    pause: function (className) {
      return lucideIcon("pause", 18, className || "icon-pause");
    },
    volumeHigh: function (className) {
      return lucideIcon("volume-2", 18, className || "icon-vol");
    },
    volumeLow: function (className) {
      return lucideIcon("volume-1", 18, className || "icon-vol-low");
    },
    volumeMute: function (className) {
      return lucideIcon("volume-x", 18, className || "icon-mute");
    },
    fullscreen: function (className) {
      return lucideIcon("maximize", 18, className || "");
    },

    /**
     * Icon for a file path / extension (Files sidebar).
     * @param {string} pathOrExt e.g. "assets/a.pdf" or "pdf"
     * @param {number} [size=18]
     */
    fileType: function (pathOrExt, size) {
      var ext = String(pathOrExt || "").trim().toLowerCase();
      var m = ext.match(/\.([a-z0-9]+)$/);
      if (m) ext = m[1];
      else if (ext.indexOf(".") !== -1) ext = ext.split(".").pop();

      var name = "file";
      if (["pdf", "txt", "md", "doc", "docx", "rtf"].indexOf(ext) !== -1) {
        name = "file-text";
      } else if (
        ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico", "avif"].indexOf(
          ext
        ) !== -1
      ) {
        name = "image";
      } else if (
        ["mp4", "webm", "mov", "mkv", "avi", "m4v"].indexOf(ext) !== -1
      ) {
        name = "film";
      } else if (["mp3", "wav", "ogg", "m4a", "aac", "flac"].indexOf(ext) !== -1) {
        name = "music";
      } else if (
        ["js", "ts", "tsx", "jsx", "json", "html", "css", "py", "rb", "go"].indexOf(
          ext
        ) !== -1
      ) {
        name = "file-code";
      } else if (["otf", "ttf", "woff", "woff2"].indexOf(ext) !== -1) {
        name = "type";
      } else if (["fig", "ai", "sketch", "psd"].indexOf(ext) !== -1) {
        name = "file-type";
      }

      return lucideIcon(name, size == null ? 18 : size, "file-type-icon");
    },
  };

  ns.lucideIcon = lucideIcon;
  ns.Icons = Icons;
})(window);
