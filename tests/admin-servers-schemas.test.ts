import { describe, expect, it } from "vitest";
import { serverInput, serverUpdate } from "@/app/api/admin/servers/schemas";

describe("server input schema", () => {
  it("accepts a full input with defaults applied", () => {
    const result = serverInput.safeParse({ name: "web-1", hostname: "web-1.internal" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual([]);
      expect(result.data.notes).toBe("");
    }
  });
  it("rejects an empty name", () => {
    expect(serverInput.safeParse({ name: "", hostname: "h" }).success).toBe(false);
  });
  it("rejects a missing hostname", () => {
    expect(serverInput.safeParse({ name: "web-1" }).success).toBe(false);
  });
});

describe("server update schema", () => {
  it("accepts an empty partial update", () => {
    expect(serverUpdate.safeParse({}).success).toBe(true);
  });
  it("accepts a partial update with just tags", () => {
    const result = serverUpdate.safeParse({ tags: ["prod", "db"] });
    expect(result.success).toBe(true);
  });
});
