import { describe, expect, it, vi } from "vitest";

const { getDb } = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("@/infrastructure/db/client", () => ({ getDb }));

function makeDb(rows: unknown[]) {
  return {
    select: () => ({
      from: () => {
        const result: Record<string, unknown> = {
          where: () => result,
          orderBy: () => Promise.resolve(rows),
          then: (resolve: (v: unknown[]) => void) => resolve(rows),
        };
        return result;
      },
    }),
  };
}

const sampleRow = { id: "l1", label: "GitHub", url: "https://github.com", icon: "github", groupLabel: "Dev", keywords: ["code"], sortOrder: 0, enabled: true, createdAt: new Date(), updatedAt: new Date() };

describe("quick link shaping", () => {
  it("shapes a row and falls back to an empty keywords array", async () => {
    const { shapeQuickLink } = await import("@/domains/quicklinks/service");
    const shaped = shapeQuickLink(sampleRow as never);
    expect(shaped.id).toBe("l1");
    expect(shaped.keywords).toEqual(["code"]);
    const shapedNoKeywords = shapeQuickLink({ ...sampleRow, keywords: undefined } as never);
    expect(shapedNoKeywords.keywords).toEqual([]);
  });
});

describe("loadQuickLinks", () => {
  it("returns live mode with enabled rows on success", async () => {
    getDb.mockReturnValue(makeDb([sampleRow]));
    const { loadQuickLinks } = await import("@/domains/quicklinks/service");
    const result = await loadQuickLinks();
    expect(result.mode).toBe("live");
    expect(result.quickLinks).toHaveLength(1);
    expect(result.quickLinks[0].label).toBe("GitHub");
  });
  it("returns unavailable mode with an empty list when the database throws", async () => {
    getDb.mockImplementation(() => { throw new Error("DATABASE_URL is not configured") });
    const { loadQuickLinks } = await import("@/domains/quicklinks/service");
    const result = await loadQuickLinks();
    expect(result.mode).toBe("unavailable");
    expect(result.quickLinks).toEqual([]);
  });
});
