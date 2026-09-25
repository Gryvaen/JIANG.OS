import { describe, expect, it, vi } from "vitest";

const { getDb } = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("@/infrastructure/db/client", () => ({ getDb }));

describe("audit-service", () => {
  it("writes the expected row shape, defaulting resourceType/metadata", async () => {
    const values = vi.fn().mockReturnValue(Promise.resolve());
    getDb.mockReturnValue({ insert: () => ({ values }) });
    const { recordAuditEvent } = await import("@/domains/audit/service");
    await recordAuditEvent({ actorId: "100000001", action: "vault_reveal", resourceType: "vault_record", resourceId: "v1" });
    expect(values).toHaveBeenCalledWith({ actorId: "100000001", action: "vault_reveal", resourceType: "vault_record", resourceId: "v1", metadata: {}, ip: undefined });
  });
  it("defaults resourceType to an empty string when omitted", async () => {
    const values = vi.fn().mockReturnValue(Promise.resolve());
    getDb.mockReturnValue({ insert: () => ({ values }) });
    const { recordAuditEvent } = await import("@/domains/audit/service");
    await recordAuditEvent({ actorId: "100000001", action: "stepup_success" });
    expect(values).toHaveBeenCalledWith({ actorId: "100000001", action: "stepup_success", resourceType: "", resourceId: undefined, metadata: {}, ip: undefined });
  });
});
