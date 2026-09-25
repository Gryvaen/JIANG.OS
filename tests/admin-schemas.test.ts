import { describe, expect, it } from "vitest";
import { noteUpdate, projectUpdate, quickLinkInput, quickLinkUpdate } from "@/app/api/admin/content/schemas";

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

describe("quick link schemas", () => {
  it("rejects a non-URL url", () => {
    const result = quickLinkInput.safeParse({ label: "X", url: "not-a-url" });
    expect(result.success).toBe(false);
  });
  it("accepts a full input with defaults applied", () => {
    const result = quickLinkInput.safeParse({ label: "GitHub", url: "https://github.com" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.icon).toBe("link");
      expect(result.data.groupLabel).toBe("General");
      expect(result.data.enabled).toBe(true);
    }
  });
  it("accepts a partial update with just enabled", () => {
    const result = quickLinkUpdate.safeParse({ enabled: false });
    expect(result.success).toBe(true);
  });
  it("accepts an empty partial update", () => {
    expect(quickLinkUpdate.safeParse({}).success).toBe(true);
  });
});
