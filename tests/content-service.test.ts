import { describe, expect, it, vi } from "vitest";
import { projects, notes, profiles } from "@/infrastructure/db/schema";

const { getDb } = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("@/infrastructure/db/client", () => ({ getDb }));

function makeDb(data: { projectRows?: unknown[]; noteRows?: unknown[]; profileRows?: unknown[] }) {
  const { projectRows = [], noteRows = [], profileRows = [] } = data;
  return {
    select: () => ({
      from: (table: unknown) => {
        const rows = table === projects ? projectRows : table === notes ? noteRows : profileRows;
        const result: Record<string, unknown> = {
          where: () => result,
          orderBy: () => Promise.resolve(rows),
          limit: () => Promise.resolve(rows),
          then: (resolve: (v: unknown[]) => void) => resolve(rows),
        };
        return result;
      },
    }),
  };
}

const sampleProjectRow = { id: "p1", slug: "demo", title: "Demo", summary: "s", status: 50, stack: ["TS"], category: "cat", featured: true, published: true, sortOrder: 1, links: [{ label: "L", url: "https://x.com" }], createdAt: new Date(), updatedAt: new Date() };
const sampleNoteRow = { id: "n1", slug: "note", title: "Note", excerpt: "e", body: "b", published: true, publishedAt: new Date("2026-01-01"), createdAt: new Date(), updatedAt: new Date() };
const sampleProfileRow = { id: "pr1", name: "Jiang", role: "Dev", bio: "bio", philosophy: "phi", location: "NY", links: [], updatedAt: new Date() };

describe("content shaping", () => {
  it("shapes a project row", async () => {
    const { shapeProject } = await import("@/domains/content/service");
    const shaped = shapeProject(sampleProjectRow as never);
    expect(shaped.id).toBe("p1");
    expect(shaped.links).toEqual([{ label: "L", url: "https://x.com" }]);
    expect(shaped.stack).toEqual(["TS"]);
  });
  it("shapes a note row", async () => {
    const { shapeNote } = await import("@/domains/content/service");
    const shaped = shapeNote(sampleNoteRow as never);
    expect(shaped.id).toBe("n1");
    expect(shaped.publishedAt).toBe(new Date("2026-01-01").toISOString());
  });
  it("shapes a note row with a null publishedAt", async () => {
    const { shapeNote } = await import("@/domains/content/service");
    const shaped = shapeNote({ ...sampleNoteRow, publishedAt: null } as never);
    expect(shaped.publishedAt).toBeNull();
  });
  it("shapes a profile row", async () => {
    const { shapeProfile } = await import("@/domains/content/service");
    const shaped = shapeProfile(sampleProfileRow as never);
    expect(shaped.name).toBe("Jiang");
    expect(shaped.links).toEqual([]);
  });
});

describe("loadPublicContent", () => {
  it("returns preview mode when the database is reachable but unseeded", async () => {
    getDb.mockReturnValue(makeDb({ profileRows: [] }));
    const { loadPublicContent } = await import("@/domains/content/service");
    const result = await loadPublicContent();
    expect(result.mode).toBe("preview");
    expect(result.content.projects.length).toBeGreaterThan(0);
  });
  it("returns unavailable mode when the database throws", async () => {
    getDb.mockImplementation(() => { throw new Error("DATABASE_URL is not configured") });
    const { loadPublicContent } = await import("@/domains/content/service");
    const result = await loadPublicContent();
    expect(result.mode).toBe("unavailable");
    expect(result.error).toBe("DATABASE_URL is not configured");
  });
  it("returns live mode with shaped rows when the database has content", async () => {
    getDb.mockReturnValue(makeDb({ projectRows: [sampleProjectRow], noteRows: [sampleNoteRow], profileRows: [sampleProfileRow] }));
    const { loadPublicContent } = await import("@/domains/content/service");
    const result = await loadPublicContent();
    expect(result.mode).toBe("live");
    expect(result.content.projects).toHaveLength(1);
    expect(result.content.notes).toHaveLength(1);
    expect(result.content.profile.name).toBe("Jiang");
  });
});
