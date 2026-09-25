// Standalone integration test for the Phase 4 agent-facing API surface.
// Run with: npx tsx scripts/simulate-agent.ts
// Requires: DATABASE_URL pointing at a schema-pushed dev DB, and a running
// dev server (npm run dev) reachable at SIMULATE_AGENT_BASE_URL
// (defaults to http://localhost:3000).
import { randomBytes } from "crypto";
import { readFileSync } from "fs";
import { eq } from "drizzle-orm";
import { getDb } from "../infrastructure/db/client";
import { incidents, serverAgents } from "../infrastructure/db/schema";
import { deriveTokenHash, signRequest } from "../domains/servers/agent-auth";
import { createServer, deleteServer, issueServerToken, revokeServerToken } from "../domains/servers/service";

function loadDotEnv() {
  try {
    const text = readFileSync(new URL("../.env", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
    }
  } catch {
    // .env is optional if the environment already has DATABASE_URL set
  }
}
loadDotEnv();

const baseUrl = process.env.SIMULATE_AGENT_BASE_URL ?? "http://localhost:3000";
let failures = 0;
function assert(name: string, condition: boolean, detail?: string) {
  if (condition) console.log(`  ok   - ${name}`);
  else { failures++; console.error(`  FAIL - ${name}${detail ? `: ${detail}` : ""}`); }
}

async function signedRequest(path: string, tokenId: string, tokenHash: string, body: unknown, opts: { timestampOffsetSeconds?: number; nonce?: string; tamperAfterSigning?: boolean } = {}) {
  const bodyText = JSON.stringify(body);
  const timestamp = String(Math.floor(Date.now() / 1000) + (opts.timestampOffsetSeconds ?? 0));
  const nonce = opts.nonce ?? randomBytes(16).toString("hex");
  const signature = signRequest(tokenHash, "POST", path, timestamp, nonce, bodyText);
  const sentBody = opts.tamperAfterSigning ? JSON.stringify({ ...(body as object), tampered: true }) : bodyText;
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Agent-Token-Id": tokenId, "X-Agent-Timestamp": timestamp, "X-Agent-Nonce": nonce, "X-Agent-Signature": signature },
    body: sentBody
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json: json as { error?: string; ok?: boolean } };
}

const heartbeatBody = { cpuPercent: 20, memoryPercent: 30, diskPercent: 40, loadAvg1: 0.5, uptimeSeconds: 1000 };

async function main() {
  console.log(`Simulating against ${baseUrl} ...`);
  const db = getDb();
  const server = await createServer({ name: "simulate-agent-test", hostname: "simulate.local", tags: ["simulated"], notes: "" });
  console.log(`Created test server ${server.id}`);
  try {
    const issued = await issueServerToken(server.id);
    const tokenHash = deriveTokenHash(issued.rawToken);
    const [agentRow] = await db.select().from(serverAgents).where(eq(serverAgents.tokenId, issued.tokenId));

    console.log("Happy path:");
    const happy = await signedRequest("/api/agent/v1/heartbeat", issued.tokenId, tokenHash, heartbeatBody);
    assert("heartbeat succeeds with a valid signature", happy.status === 200, JSON.stringify(happy));

    console.log("Rejection cases:");
    const sharedNonce = randomBytes(16).toString("hex");
    const first = await signedRequest("/api/agent/v1/heartbeat", issued.tokenId, tokenHash, heartbeatBody, { nonce: sharedNonce });
    assert("first use of a nonce succeeds", first.status === 200, JSON.stringify(first));
    const replay = await signedRequest("/api/agent/v1/heartbeat", issued.tokenId, tokenHash, heartbeatBody, { nonce: sharedNonce });
    assert("replayed nonce is rejected", replay.status === 401 && replay.json.error === "replay", JSON.stringify(replay));

    const stale = await signedRequest("/api/agent/v1/heartbeat", issued.tokenId, tokenHash, heartbeatBody, { timestampOffsetSeconds: -400 });
    assert("stale timestamp is rejected", stale.status === 401 && stale.json.error === "stale", JSON.stringify(stale));

    const tampered = await signedRequest("/api/agent/v1/heartbeat", issued.tokenId, tokenHash, heartbeatBody, { tamperAfterSigning: true });
    assert("tampered body is rejected", tampered.status === 401 && tampered.json.error === "invalid_signature", JSON.stringify(tampered));

    await revokeServerToken(agentRow.id);
    const revoked = await signedRequest("/api/agent/v1/heartbeat", issued.tokenId, tokenHash, heartbeatBody);
    assert("heartbeat after revocation is rejected", revoked.status === 401 && revoked.json.error === "revoked", JSON.stringify(revoked));

    console.log("Alert open/resolve cycle (fresh token):");
    const issued2 = await issueServerToken(server.id);
    const tokenHash2 = deriveTokenHash(issued2.rawToken);
    for (let i = 0; i < 3; i++) {
      const res = await signedRequest("/api/agent/v1/heartbeat", issued2.tokenId, tokenHash2, { ...heartbeatBody, cpuPercent: 95 });
      assert(`bad sample ${i + 1}/3 accepted`, res.status === 200, JSON.stringify(res));
    }
    const openIncidents = await db.select().from(incidents).where(eq(incidents.serverId, server.id));
    const cpuIncident = openIncidents.find(i => i.source === "metric" && i.sourceRef === "cpu" && i.status === "open");
    assert("sustained bad CPU samples open an incident", Boolean(cpuIncident), JSON.stringify(openIncidents));

    for (let i = 0; i < 2; i++) {
      const res = await signedRequest("/api/agent/v1/heartbeat", issued2.tokenId, tokenHash2, { ...heartbeatBody, cpuPercent: 50 });
      assert(`recovery sample ${i + 1}/2 accepted`, res.status === 200, JSON.stringify(res));
    }
    const afterRecovery = await db.select().from(incidents).where(eq(incidents.serverId, server.id));
    const resolvedIncident = afterRecovery.find(i => i.source === "metric" && i.sourceRef === "cpu" && i.status === "resolved");
    assert("recovery samples resolve the incident", Boolean(resolvedIncident), JSON.stringify(afterRecovery));
  } finally {
    await deleteServer(server.id);
    console.log(`Cleaned up test server ${server.id}`);
  }

  console.log(failures === 0 ? `\nAll checks passed.` : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(error => { console.error(error); process.exit(1); });
