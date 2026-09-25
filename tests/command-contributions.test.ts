import { describe, expect, it, vi } from "vitest";
import { getApp } from "@/core/app-registry";
import { commandContributions } from "@/core/command-contributions";

describe("commandContributions", () => {
  it("registers 3 search commands for the web app", () => {
    const cmds = commandContributions.web!(getApp("web"));
    expect(cmds.map(c => c.id)).toEqual(["web.yt", "web.gh", "web.search"]);
  });
  it("yt command returns an openUrl for a query", () => {
    const cmds = commandContributions.web!(getApp("web"));
    const yt = cmds.find(c => c.id === "web.yt")!;
    const result = yt.execute({ openApp: vi.fn(), setTheme: vi.fn() }, ["cats"]);
    expect(result).toEqual({ ok: true, output: 'Searching YouTube for "cats"…', openUrl: "https://www.youtube.com/results?search_query=cats" });
  });
  it("yt command rejects an empty query", () => {
    const cmds = commandContributions.web!(getApp("web"));
    const yt = cmds.find(c => c.id === "web.yt")!;
    expect(yt.execute({ openApp: vi.fn(), setTheme: vi.fn() }, []).ok).toBe(false);
  });
  it("tools.translate rejects empty text and accepts text", () => {
    const cmds = commandContributions.tools!(getApp("tools"));
    const translate = cmds[0];
    expect(translate.execute({ openApp: vi.fn(), setTheme: vi.fn() }, []).ok).toBe(false);
    const result = translate.execute({ openApp: vi.fn(), setTheme: vi.fn() }, ["hello"]);
    expect(result.ok).toBe(true);
    expect(result.openUrl).toContain("translate.google.com");
  });
});
