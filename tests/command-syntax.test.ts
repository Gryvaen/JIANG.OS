import { describe, expect, it } from "vitest";
import { parseCommandPrefix } from "@/core/command-syntax";

describe("parseCommandPrefix", () => {
  it("parses a known prefix with a rest", () => {
    expect(parseCommandPrefix("open projects")).toEqual({ prefix: "open", rest: "projects" });
  });
  it("returns null for text without a known prefix", () => {
    expect(parseCommandPrefix("hello world")).toBeNull();
  });
  it("returns null when a known prefix has no rest", () => {
    expect(parseCommandPrefix("yt")).toBeNull();
  });
  it("returns null for empty input", () => {
    expect(parseCommandPrefix("")).toBeNull();
  });
});
