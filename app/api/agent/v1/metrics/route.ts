import { NextResponse } from "next/server";
import { readAgentAuthHeaders } from "@/domains/servers/agent-auth";
import { authenticateAgentRequest, recordMetricsBatch } from "@/domains/servers/service";
import { metricsBody } from "../schemas";
export async function POST(request: Request) {
  const headers = readAgentAuthHeaders(request.headers);
  if (!headers) return NextResponse.json({ error: "missing_headers" }, { status: 401 });
  const bodyText = await request.text();
  const path = new URL(request.url).pathname;
  const auth = await authenticateAgentRequest(headers, "POST", path, bodyText);
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: 401 });
  let json: unknown;
  try { json = JSON.parse(bodyText || "{}"); } catch { return NextResponse.json({ error: "invalid_body" }, { status: 400 }); }
  const parsed = metricsBody.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  await recordMetricsBatch(auth.serverId, parsed.data.samples);
  return NextResponse.json({ ok: true });
}
