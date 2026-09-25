// One-off dev helper: creates a persistent demo server + token, then pushes
// a few real signed heartbeats (including a sustained-bad-CPU incident) so
// the Servers/Monitor apps and Notification Center have live data to render.
// Run with: npx tsx scripts/seed-demo-server.ts
// Requires: DATABASE_URL pointing at a schema-pushed dev DB, and a running
// dev server reachable at SEED_DEMO_BASE_URL (defaults to http://localhost:3000).
import { randomBytes } from "crypto";
import { readFileSync } from "fs";
import { deriveTokenHash, signRequest } from "../domains/servers/agent-auth";
import { createServer, issueServerToken } from "../domains/servers/service";

function loadDotEnv() {
  try {
    const text = readFileSync(new URL("../.env", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
    }
  } catch {}
}
loadDotEnv();

const baseUrl = process.env.SEED_DEMO_BASE_URL ?? "http://localhost:3000";

async function signedRequest(path: string, tokenId: string, tokenHash: string, body: unknown) {
  const bodyText = JSON.stringify(body);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = randomBytes(16).toString("hex");
  const signature = signRequest(tokenHash, "POST", path, timestamp, nonce, bodyText);
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Agent-Token-Id": tokenId, "X-Agent-Timestamp": timestamp, "X-Agent-Nonce": nonce, "X-Agent-Signature": signature },
    body: bodyText
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function main() {
  console.log(`Seeding against ${baseUrl} ...`);
  const server = await createServer({ name: "demo-web-01", hostname: "demo-web-01.local", tags: ["demo", "web"], notes: "Seeded for manual owner-mode smoke testing." });
  console.log(`Created server ${server.id} (demo-web-01)`);
  const issued = await issueServerToken(server.id);
  const tokenHash = deriveTokenHash(issued.rawToken);
  console.log(`Issued token ${issued.tokenId} (raw token, shown once): ${issued.rawToken}`);

  for (let i = 0; i < 5; i++) {
    const res = await signedRequest("/api/agent/v1/heartbeat", issued.tokenId, tokenHash, { cpuPercent: 25 + Math.random() * 10, memoryPercent: 40 + Math.random() * 10, diskPercent: 55, loadAvg1: 0.6, uptimeSeconds: 3600 + i * 60 });
    console.log(`healthy heartbeat ${i + 1}/5 -> ${res.status}`);
    await new Promise(r => setTimeout(r, 300));
  }

  for (let i = 0; i < 3; i++) {
    const res = await signedRequest("/api/agent/v1/heartbeat", issued.tokenId, tokenHash, { cpuPercent: 96, memoryPercent: 60, diskPercent: 55, loadAvg1: 4.2, uptimeSeconds: 4000 + i * 60 });
    console.log(`bad-cpu heartbeat ${i + 1}/3 -> ${res.status}`);
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\nDone. Server "demo-web-01" should now show status=degraded/offline with an open CPU incident in the Servers App and Notification Center.`);
  console.log(`Server id: ${server.id}`);
}

main().catch(error => { console.error(error); process.exit(1); });
