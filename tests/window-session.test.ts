import { describe, expect, it } from "vitest";
import { restoreWindows, serializeWindows } from "@/core/window-session";
import type { WindowState } from "@/core/types";

const sample: WindowState = { instanceId: "projects-1", appId: "projects", x: 10, y: 44, width: 700, height: 500, status: "open", zIndex: 1 };

describe("window session", () => {
  it("round-trips a valid window list", () => {
    const raw = serializeWindows([sample]);
    expect(restoreWindows(raw)).toEqual([sample]);
  });
  it("returns an empty list for null input", () => {
    expect(restoreWindows(null)).toEqual([]);
  });
  it("returns an empty list for malformed JSON", () => {
    expect(restoreWindows("{not json")).toEqual([]);
  });
  it("drops entries with an unknown appId", () => {
    const raw = JSON.stringify([{ ...sample, appId: "nonexistent" }]);
    expect(restoreWindows(raw)).toEqual([]);
  });
  it("drops entries missing required fields", () => {
    const raw = JSON.stringify([{ instanceId: "x", appId: "projects" }]);
    expect(restoreWindows(raw)).toEqual([]);
  });
  it("round-trips a window carrying a payload", () => {
    const withPayload: WindowState = { ...sample, payload: { item: "riscv-cpu" } };
    const raw = serializeWindows([withPayload]);
    expect(restoreWindows(raw)).toEqual([withPayload]);
  });
  it("round-trips a window without a payload for backward compatibility", () => {
    const raw = serializeWindows([sample]);
    expect(restoreWindows(raw)).toEqual([sample]);
  });
});
