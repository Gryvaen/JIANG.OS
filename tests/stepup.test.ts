import { beforeAll, describe, expect, it } from "vitest";
import { issueStepUpToken, verifyStepUpToken } from "@/domains/auth/stepup";

describe("stepup", () => {
  beforeAll(() => { process.env.STEPUP_SESSION_SECRET = "test-stepup-secret" });
  it("round-trips a freshly issued token", () => {
    const token = issueStepUpToken("100000001", 1000);
    expect(verifyStepUpToken(token, 1000)).toBe(true);
  });
  it("accepts a token at the exact TTL boundary and rejects just past it", () => {
    const token = issueStepUpToken("100000001", 1000);
    expect(verifyStepUpToken(token, 1300)).toBe(true);
    expect(verifyStepUpToken(token, 1301)).toBe(false);
  });
  it("rejects a tampered signature", () => {
    const token = issueStepUpToken("100000001", 1000);
    const [payload] = token.split(".");
    expect(verifyStepUpToken(`${payload}.deadbeef`, 1000)).toBe(false);
  });
  it("rejects a malformed token without throwing", () => {
    expect(verifyStepUpToken("not-a-real-token", 1000)).toBe(false);
    expect(verifyStepUpToken(undefined, 1000)).toBe(false);
  });
});
