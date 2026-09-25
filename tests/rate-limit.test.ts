import { describe, expect, it } from "vitest";
import { rateLimit } from "@/domains/auth/rate-limit";

describe("rate-limit", () => {
  it("allows requests up to the limit then blocks", () => {
    const key = "test:allow-then-block";
    expect(rateLimit(key, 2, 1000, 0)).toBe(true);
    expect(rateLimit(key, 2, 1000, 10)).toBe(true);
    expect(rateLimit(key, 2, 1000, 20)).toBe(false);
  });
  it("resets the window after windowMs elapses", () => {
    const key = "test:window-reset";
    expect(rateLimit(key, 1, 1000, 0)).toBe(true);
    expect(rateLimit(key, 1, 1000, 500)).toBe(false);
    expect(rateLimit(key, 1, 1000, 1500)).toBe(true);
  });
  it("tracks separate keys independently", () => {
    expect(rateLimit("test:a", 1, 1000, 0)).toBe(true);
    expect(rateLimit("test:b", 1, 1000, 0)).toBe(true);
  });
});
