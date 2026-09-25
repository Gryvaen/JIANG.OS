import { describe, expect, it } from "vitest";
import { evaluateExpression } from "@/components/apps/tools/calculator";
import { formatJson } from "@/components/apps/tools/json-formatter";
import { isoToUnix, unixToIso } from "@/components/apps/tools/timestamp";
import { decodeBase64, encodeBase64 } from "@/components/apps/tools/base64";
import { generateUuids } from "@/components/apps/tools/uuid";
import { testRegex } from "@/components/apps/tools/regex";
import { buildQrDataUrl } from "@/components/apps/tools/qr-code";

describe("calculator", () => {
  it("evaluates simple arithmetic", () => {
    expect(evaluateExpression("2+2")).toBe(4);
    expect(evaluateExpression("(2+3)*4")).toBe(20);
  });
  it("returns null for invalid expressions", () => {
    expect(evaluateExpression("2+")).toBeNull();
    expect(evaluateExpression("abc")).toBeNull();
  });
});

describe("json formatter", () => {
  it("pretty-prints valid JSON", () => {
    const result = formatJson('{"a":1}');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.output).toBe('{\n  "a": 1\n}');
  });
  it("returns an error for invalid JSON", () => {
    const result = formatJson("{bad");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(typeof result.error).toBe("string");
  });
});

describe("timestamp", () => {
  it("round-trips a known timestamp", () => {
    const iso = unixToIso(0);
    expect(iso).toBe(new Date(0).toISOString());
    expect(isoToUnix(iso!)).toBe(0);
  });
  it("returns null for garbage input", () => {
    expect(unixToIso(NaN)).toBeNull();
    expect(isoToUnix("not-a-date")).toBeNull();
  });
});

describe("base64", () => {
  it("round-trips a UTF-8 string including non-ASCII", () => {
    const input = "héllo 🎉";
    expect(decodeBase64(encodeBase64(input))).toBe(input);
  });
  it("returns null for invalid base64", () => {
    expect(decodeBase64("not-base64!!")).toBeNull();
  });
});

describe("uuid generator", () => {
  it("returns the requested count of valid v4 UUIDs", () => {
    const ids = generateUuids(5);
    expect(ids).toHaveLength(5);
    for (const id of ids) expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
  it("clamps the count to [1,50]", () => {
    expect(generateUuids(0)).toHaveLength(1);
    expect(generateUuids(999)).toHaveLength(50);
  });
});

describe("regex tester", () => {
  it("returns matches for a valid pattern", () => {
    const result = testRegex("\\d+", "g", "a1 b22 c333");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.matches).toEqual(["1", "22", "333"]);
  });
  it("returns an error for an invalid pattern", () => {
    const result = testRegex("(", "g", "x");
    expect(result.ok).toBe(false);
  });
});

describe("qr code", () => {
  it("returns null for empty input", () => {
    expect(buildQrDataUrl("")).toBeNull();
    expect(buildQrDataUrl("   ")).toBeNull();
  });
  it("returns a data URL for non-empty input", () => {
    const url = buildQrDataUrl("https://jiang.os");
    expect(url).toMatch(/^data:image\//);
  });
});
