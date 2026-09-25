import { beforeAll, describe, expect, it } from "vitest";
import { decryptVaultFields, encryptVaultFields } from "@/domains/vault/crypto";

describe("vault-crypto", () => {
  beforeAll(() => { process.env.VAULT_MASTER_KEY = Buffer.alloc(32, 7).toString("base64") });
  it("round-trips plaintext through encrypt/decrypt", () => {
    const plaintext = { alias: "demo-web-01", username: "root", port: 22 };
    const { ciphertext, nonce, keyVersion } = encryptVaultFields(plaintext);
    expect(decryptVaultFields(ciphertext, nonce, keyVersion)).toEqual(plaintext);
  });
  it("detects tampering via the GCM auth tag", () => {
    const { ciphertext, nonce, keyVersion } = encryptVaultFields({ a: 1 });
    const tampered = Buffer.from(ciphertext, "base64");
    tampered[0] ^= 0xff;
    expect(() => decryptVaultFields(tampered.toString("base64"), nonce, keyVersion)).toThrow();
  });
  it("rejects an unsupported key version", () => {
    const { ciphertext, nonce } = encryptVaultFields({ a: 1 });
    expect(() => decryptVaultFields(ciphertext, nonce, 2)).toThrow(/Unsupported key version/);
  });
  it("throws when VAULT_MASTER_KEY is missing", () => {
    const prev = process.env.VAULT_MASTER_KEY;
    delete process.env.VAULT_MASTER_KEY;
    expect(() => encryptVaultFields({ a: 1 })).toThrow(/VAULT_MASTER_KEY/);
    process.env.VAULT_MASTER_KEY = prev;
  });
});
