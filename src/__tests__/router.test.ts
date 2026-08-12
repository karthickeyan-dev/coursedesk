import { describe, expect, it } from "vitest";
import {
  getCoursePath,
  getLibraryPath,
  getRouteFromLocation,
} from "../lib/router";

describe("router", () => {
  describe("getRouteFromLocation", () => {
    it("returns library view for root path", () => {
      const loc = { pathname: "/", search: "", hash: "" };
      expect(getRouteFromLocation(loc)).toEqual({ view: "library" });
    });

    it("parses course route from pathname /course/:id", () => {
      const loc = { pathname: "/course/react-101", search: "", hash: "" };
      expect(getRouteFromLocation(loc)).toEqual({
        view: "course",
        courseId: "react-101",
      });
    });

    it("decodes URI encoded courseId in pathname", () => {
      const loc = { pathname: "/course/my%20course", search: "", hash: "" };
      expect(getRouteFromLocation(loc)).toEqual({
        view: "course",
        courseId: "my course",
      });
    });

    it("parses course route from search params ?course=:id", () => {
      const loc = { pathname: "/", search: "?course=node-advanced", hash: "" };
      expect(getRouteFromLocation(loc)).toEqual({
        view: "course",
        courseId: "node-advanced",
      });
    });

    it("parses course route from hash #/course/:id", () => {
      const loc = { pathname: "/", search: "", hash: "#/course/vue-basics" };
      expect(getRouteFromLocation(loc)).toEqual({
        view: "course",
        courseId: "vue-basics",
      });
    });

    it("defaults to library view on unknown path", () => {
      const loc = { pathname: "/unknown/path", search: "", hash: "" };
      expect(getRouteFromLocation(loc)).toEqual({ view: "library" });
    });
  });

  describe("path generators", () => {
    it("generates course path with encoding", () => {
      expect(getCoursePath("react-101")).toBe("/course/react-101");
      expect(getCoursePath("c++ basics")).toBe("/course/c%2B%2B%20basics");
    });

    it("generates library path", () => {
      expect(getLibraryPath()).toBe("/");
    });
  });
});
