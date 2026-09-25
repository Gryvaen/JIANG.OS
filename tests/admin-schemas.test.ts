import { describe, expect, it } from "vitest";
import { noteUpdate, projectUpdate } from "@/app/api/admin/content/schemas";

describe("admin content update schemas", () => {
  it("accepts a partial project update with just published", () => {
    const result = projectUpdate.safeParse({ published: true });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ published: true });
  });
  it("accepts an empty partial update", () => {
    expect(projectUpdate.safeParse({}).success).toBe(true);
    expect(noteUpdate.safeParse({}).success).toBe(true);
  });
  it("rejects a bad slug on partial project update", () => {
    const result = projectUpdate.safeParse({ slug: "Not A Slug!" });
    expect(result.success).toBe(false);
  });
  it("accepts a partial note update with just published", () => {
    const result = noteUpdate.safeParse({ published: false });
    expect(result.success).toBe(true);
  });
  it("rejects a bad slug on partial note update", () => {
    expect(noteUpdate.safeParse({ slug: "BAD SLUG" }).success).toBe(false);
  });
});
