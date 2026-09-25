import { describe, expect, it } from "vitest";
import { canonicalString, deriveTokenHash, isTimestampFresh, signRequest, verifySignature } from "@/domains/servers/agent-auth";

describe("agent-auth", () => {
  it("builds a canonical string with a body hash", () => {
    const s = canonicalString("POST", "/api/agent/v1/heartbeat", "1700000000", "abc123", "{}");
    expect(s.split("\n")).toHaveLength(5);
    expect(s.startsWith("POST\n/api/agent/v1/heartbeat\n1700000000\nabc123\n")).toBe(true);
  });
  it("round-trips a valid signature", () => {
    const tokenHash = deriveTokenHash("raw-secret");
    const sig = signRequest(tokenHash, "POST", "/x", "1700000000", "nonce1", "{\"a\":1}");
    expect(verifySignature(tokenHash, "POST", "/x", "1700000000", "nonce1", "{\"a\":1}", sig)).toBe(true);
  });
  it("rejects a tampered body", () => {
    const tokenHash = deriveTokenHash("raw-secret");
    const sig = signRequest(tokenHash, "POST", "/x", "1700000000", "nonce1", "{\"a\":1}");
    expect(verifySignature(tokenHash, "POST", "/x", "1700000000", "nonce1", "{\"a\":2}", sig)).toBe(false);
  });
  it("rejects a signature from a different key", () => {
    const tokenHash = deriveTokenHash("raw-secret");
    const otherHash = deriveTokenHash("other-secret");
    const sig = signRequest(otherHash, "POST", "/x", "1700000000", "nonce1", "{}");
    expect(verifySignature(tokenHash, "POST", "/x", "1700000000", "nonce1", "{}", sig)).toBe(false);
  });
  it("rejects a malformed signature without throwing", () => {
    const tokenHash = deriveTokenHash("raw-secret");
    expect(verifySignature(tokenHash, "POST", "/x", "1700000000", "nonce1", "{}", "not-hex!!")).toBe(false);
  });
  it("accepts a timestamp exactly at the freshness window boundary", () => {
    expect(isTimestampFresh("1000", 1300, 300)).toBe(true);
  });
  it("rejects a timestamp just outside the freshness window", () => {
    expect(isTimestampFresh("999", 1300, 300)).toBe(false);
  });
  it("rejects a non-numeric timestamp", () => {
    expect(isTimestampFresh("not-a-number")).toBe(false);
  });
  // Cross-language fixed vector — asserted identically in agent/internal/client/sign_test.go
  // to gate the Go agent's signing implementation staying byte-for-byte compatible.
  it("matches the fixed cross-language test vector shared with the Go agent", () => {
    const tokenHash = deriveTokenHash("raw-secret");
    expect(tokenHash).toBe("96820dfd08df73515beece5adfea687bed8e38234e63ff1b8251d5d20af172e4");
    const sig = signRequest(tokenHash, "POST", "/api/agent/v1/heartbeat", "1700000000", "fixed-nonce-000000", "{\"cpuPercent\":42.5}");
    expect(sig).toBe("f4af8f28e33af485609ab0054fa99568f38498de848de586abfa41f5f60c9b85");
  });
});
