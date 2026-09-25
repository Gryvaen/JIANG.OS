import { describe, expect, it } from "vitest";
import { computeServerStatus } from "@/domains/servers/status";

describe("computeServerStatus", () => {
  it("is unknown when no heartbeat has ever been received", () => {
    expect(computeServerStatus(null)).toBe("unknown");
  });
  it("is online for a recent heartbeat", () => {
    const now = new Date("2026-01-01T00:00:30Z");
    expect(computeServerStatus(new Date("2026-01-01T00:00:00Z"), now)).toBe("online");
  });
  it("is degraded once past the degraded threshold", () => {
    const now = new Date("2026-01-01T00:02:00Z");
    expect(computeServerStatus(new Date("2026-01-01T00:00:00Z"), now)).toBe("degraded");
  });
  it("is offline once past the offline threshold", () => {
    const now = new Date("2026-01-01T00:10:00Z");
    expect(computeServerStatus(new Date("2026-01-01T00:00:00Z"), now)).toBe("offline");
  });
  it("is unknown for a heartbeat that appears to be in the future (clock skew)", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(computeServerStatus(new Date("2026-01-01T00:01:00Z"), now)).toBe("unknown");
  });
});
