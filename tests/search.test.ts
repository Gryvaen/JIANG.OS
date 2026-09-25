import { describe, expect, it, vi } from "vitest";
import { runSearch } from "@/core/search";
import type { SearchIndexData } from "@/core/search";

const emptyData: SearchIndexData = { projects: [], notes: [], quickLinks: [] };

const dataWithContent: SearchIndexData = {
  projects: [{ id: "p1", slug: "riscv-cpu", title: "RISC-V CPU", summary: "A cpu", status: 50, stack: [], category: "Hardware", featured: true, published: true, sortOrder: 0, links: [] }],
  notes: [],
  quickLinks: [{ id: "l1", label: "GitHub", url: "https://github.com", icon: "github", groupLabel: "Dev", keywords: [], sortOrder: 0, enabled: true }],
};

describe("runSearch", () => {
  it("returns app results for a known app-name substring", () => {
    const results = runSearch("project", emptyData);
    expect(results.some(r => r.type === "app" && r.title === "Projects")).toBe(true);
  });
  it("returns project results whose execute opens projects with the item payload", () => {
    const results = runSearch("risc-v", dataWithContent);
    const projectResult = results.find(r => r.type === "project")!;
    expect(projectResult).toBeDefined();
    const openApp = vi.fn();
    projectResult.execute({ openApp, setTheme: vi.fn() });
    expect(openApp).toHaveBeenCalledWith("projects", { item: "riscv-cpu" });
  });
  it("returns quicklink results whose execute returns an openUrl", () => {
    const results = runSearch("github", dataWithContent);
    const linkResult = results.find(r => r.type === "quicklink")!;
    expect(linkResult).toBeDefined();
    const result = linkResult.execute({ openApp: vi.fn(), setTheme: vi.fn() });
    expect(result).toEqual({ ok: true, output: "Opening GitHub…", openUrl: "https://github.com" });
  });
  it("includes contributed commands when searching youtube/translate", () => {
    const yt = runSearch("youtube", emptyData);
    expect(yt.some(r => r.type === "command" && r.title === "Search YouTube")).toBe(true);
    const translate = runSearch("translate", emptyData);
    expect(translate.some(r => r.type === "command" && r.title === "Translate")).toBe(true);
  });
  it("sorts results descending by score", () => {
    const results = runSearch("a", dataWithContent);
    for (let i = 1; i < results.length; i++) expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
  });
  it("returns all apps for an empty query", () => {
    const results = runSearch("", emptyData);
    expect(results.filter(r => r.type === "app").length).toBeGreaterThan(0);
  });
  it("hides owner-only apps and their commands when no role is provided", () => {
    const results = runSearch("servers", emptyData);
    expect(results.some(r => r.type === "app" && r.title === "Servers")).toBe(false);
    expect(results.some(r => r.type === "command" && r.title === "Servers status")).toBe(false);
  });
  it("hides owner-only apps and their commands for a viewer role", () => {
    const results = runSearch("servers", { ...emptyData, role: "viewer" });
    expect(results.some(r => r.type === "app" && r.title === "Servers")).toBe(false);
    expect(results.some(r => r.type === "command" && r.title === "Servers status")).toBe(false);
  });
  it("shows owner-only apps and their commands for the owner role", () => {
    const results = runSearch("servers", { ...emptyData, role: "owner" });
    expect(results.some(r => r.type === "app" && r.title === "Servers")).toBe(true);
    expect(results.some(r => r.type === "command" && r.title === "Servers status")).toBe(true);
  });
});
