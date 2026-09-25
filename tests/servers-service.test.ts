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

const sampleServerRow = { id: "s1", name: "web-1", hostname: "web-1.internal", tags: ["prod"], notes: "", lastHeartbeatAt: null, lastMetrics: null, alertState: {}, createdAt: new Date(), updatedAt: new Date() };

describe("shapeServer", () => {
  it("computes status from the heartbeat and falls back to empty tags/alertState", async () => {
    const { shapeServer } = await import("@/domains/servers/service");
    const shaped = shapeServer(sampleServerRow as never);
    expect(shaped.status).toBe("unknown");
    expect(shaped.tags).toEqual(["prod"]);
    const shapedNoTags = shapeServer({ ...sampleServerRow, tags: undefined, alertState: undefined } as never);
    expect(shapedNoTags.tags).toEqual([]);
    expect(shapedNoTags.alertState).toEqual({});
  });
});

describe("loadServersForOwner", () => {
  it("returns live mode with shaped rows on success", async () => {
    getDb.mockReturnValue(makeDb([sampleServerRow]));
    const { loadServersForOwner } = await import("@/domains/servers/service");
    const result = await loadServersForOwner();
    expect(result.mode).toBe("live");
    expect(result.servers).toHaveLength(1);
    expect(result.servers[0].name).toBe("web-1");
  });
  it("returns unavailable mode with an empty list when the database throws", async () => {
    getDb.mockImplementation(() => { throw new Error("DATABASE_URL is not configured") });
    const { loadServersForOwner } = await import("@/domains/servers/service");
    const result = await loadServersForOwner();
    expect(result.mode).toBe("unavailable");
    expect(result.servers).toEqual([]);
  });
});
