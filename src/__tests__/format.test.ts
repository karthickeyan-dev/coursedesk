import { describe, expect, it } from "vitest";
import {
  applyResumeSeconds,
  canViewInBrowser,
  fileBasename,
  fileIconLabel,
  fileKind,
  formatDurationTotal,
  formatRate,
  formatTime,
} from "../lib/format";

describe("formatTime", () => {
  it("formats mm:ss and h:mm:ss", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(3661)).toBe("1:01:01");
  });
});

describe("formatRate", () => {
  it("appends multiplication sign", () => {
    expect(formatRate(1)).toBe("1×");
    expect(formatRate(1.25)).toBe("1.25×");
  });
});

describe("formatDurationTotal", () => {
  it("formats human duration", () => {
    expect(formatDurationTotal(0)).toBe("0m");
    expect(formatDurationTotal(90)).toBe("1m 30s");
    expect(formatDurationTotal(3600)).toBe("1h");
  });
});

describe("fileBasename", () => {
  it("returns the last path segment", () => {
    expect(fileBasename("assets/cheatsheet.pdf")).toBe("cheatsheet.pdf");
    expect(fileBasename("mock.fig")).toBe("mock.fig");
  });

  it("falls back when empty", () => {
    expect(fileBasename("")).toBe("download");
  });
});

describe("fileKind", () => {
  it("classifies common course file types", () => {
    expect(fileKind("assets/cheatsheet.pdf")).toBe("pdf");
    expect(fileKind("shot.PNG")).toBe("image");
    expect(fileKind("clip.mp4")).toBe("video");
    expect(fileKind("theme.mp3")).toBe("audio");
    expect(fileKind("files.zip")).toBe("archive");
    expect(fileKind("grades.xlsx")).toBe("spreadsheet");
    expect(fileKind("deck.pptx")).toBe("presentation");
    expect(fileKind("brief.docx")).toBe("document");
    expect(fileKind("demo.js")).toBe("code");
    expect(fileKind("notes.md")).toBe("text");
    expect(fileKind("mock.fig")).toBe("design");
    expect(fileKind("noext")).toBe("file");
  });
});

describe("fileIconLabel", () => {
  it("fits the badge", () => {
    expect(fileIconLabel("a.pdf")).toBe("PDF");
    expect(fileIconLabel("a.jpeg")).toBe("JPG");
    expect(fileIconLabel("a.markdown")).toBe("MD");
    expect(fileIconLabel("a.fig")).toBe("FIG");
  });
});

describe("canViewInBrowser", () => {
  it("allows formats the browser can render", () => {
    expect(canViewInBrowser("assets/photo.png")).toBe(true);
    expect(canViewInBrowser("notes.PDF")).toBe(true);
    expect(canViewInBrowser("clip.mp4")).toBe(true);
    expect(canViewInBrowser("readme.txt")).toBe(true);
  });

  it("rejects unsupported binaries", () => {
    expect(canViewInBrowser("mock.fig")).toBe(false);
    expect(canViewInBrowser("archive.zip")).toBe(false);
    expect(canViewInBrowser("slides.pptx")).toBe(false);
    expect(canViewInBrowser("design.psd")).toBe(false);
  });
});

describe("applyResumeSeconds", () => {
  it("restarts near end", () => {
    expect(applyResumeSeconds(95, 100)).toBe(0);
  });

  it("resumes mid video", () => {
    expect(applyResumeSeconds(40, 100)).toBe(40);
  });

  it("ignores short positions", () => {
    expect(applyResumeSeconds(1, 100)).toBeNull();
  });
});
