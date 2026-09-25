import { describe, expect, it } from "vitest";
import { isSameOrigin } from "@/domains/auth/csrf";

function makeRequest(url: string, origin?: string) {
  return new Request(url, { headers: origin ? { origin } : {} });
}

describe("csrf", () => {
  it("allows a request whose Origin header matches the request host", () => {
    expect(isSameOrigin(makeRequest("https://jiang.os/api/vault/records", "https://jiang.os"))).toBe(true);
  });
  it("blocks a request whose Origin header is a different host", () => {
    expect(isSameOrigin(makeRequest("https://jiang.os/api/vault/records", "https://evil.example"))).toBe(false);
  });
  it("allows a request with no Origin header (same-origin GETs often omit it)", () => {
    expect(isSameOrigin(makeRequest("https://jiang.os/api/vault/records"))).toBe(true);
  });
  it("blocks a request with a malformed Origin header", () => {
    expect(isSameOrigin(makeRequest("https://jiang.os/api/vault/records", "not-a-url"))).toBe(false);
  });
});
