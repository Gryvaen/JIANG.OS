import { beforeAll, describe, expect, it, vi } from "vitest";

const { getDb } = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("@/infrastructure/db/client", () => ({ getDb }));

function makeSelectDb(rows: unknown[]) {
  return {
    select: () => ({
      from: () => {
        const result: Record<string, unknown> = {
          where: () => result,
          orderBy: () => Promise.resolve(rows),
          then: (resolve: (v: unknown[]) => void) => resolve(rows),
        };
        return result;
      },
    }),
  };
}

describe("vault-service", () => {
  beforeAll(() => { process.env.VAULT_MASTER_KEY = Buffer.alloc(32, 3).toString("base64") });

  it("listVaultRecords never exposes encryptedFields/encryptionNonce", async () => {
    const { encryptVaultFields } = await import("@/domains/vault/crypto");
    const enc = encryptVaultFields({ redactedAddress: "10.0.0.x", username: "root", port: 22, notes: "", managerRef: "1p:demo", sshCommandTemplate: "ssh root@10.0.0.x" });
    const row = { id: "v1", alias: "demo-web-01", provider: "hetzner", tags: ["prod"], encryptedFields: enc.ciphertext, encryptionNonce: enc.nonce, keyVersion: enc.keyVersion, archivedAt: null, deletedAt: null, createdAt: new Date(), updatedAt: new Date() };
    getDb.mockReturnValue(makeSelectDb([row]));
    const { listVaultRecords } = await import("@/domains/vault/service");
    const result = await listVaultRecords();
    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty("encryptedFields");
    expect(result[0]).not.toHaveProperty("encryptionNonce");
    expect(result[0].alias).toBe("demo-web-01");
  });

  it("getVaultRecordRevealed decrypts the stored fields", async () => {
    const { encryptVaultFields } = await import("@/domains/vault/crypto");
    const enc = encryptVaultFields({ redactedAddress: "10.0.0.x", username: "root", port: 22, notes: "note", managerRef: "1p:demo", sshCommandTemplate: "ssh root@10.0.0.x" });
    const row = { id: "v1", alias: "demo-web-01", provider: "hetzner", tags: [], encryptedFields: enc.ciphertext, encryptionNonce: enc.nonce, keyVersion: enc.keyVersion, archivedAt: null, deletedAt: null, createdAt: new Date(), updatedAt: new Date() };
    getDb.mockReturnValue({ select: () => ({ from: () => ({ where: () => Promise.resolve([row]) }) }) });
    const { getVaultRecordRevealed } = await import("@/domains/vault/service");
    const result = await getVaultRecordRevealed("v1");
    expect(result?.username).toBe("root");
    expect(result?.port).toBe(22);
    expect(result?.notes).toBe("note");
  });

  it("getVaultRecordMasked returns null when no row matches", async () => {
    getDb.mockReturnValue({ select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }) });
    const { getVaultRecordMasked } = await import("@/domains/vault/service");
    expect(await getVaultRecordMasked("missing")).toBeNull();
  });
});
