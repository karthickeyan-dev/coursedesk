import { describe, expect, it } from "vitest";
import {
  applyResumeSeconds,
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
