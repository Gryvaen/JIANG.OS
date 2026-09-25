import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/domains/audit/service";
import { isSameOrigin } from "@/domains/auth/csrf";
import { rateLimit } from "@/domains/auth/rate-limit";
import { requireOwner, requireStepUp } from "@/domains/auth/service";
import { ipFromRequest } from "@/domains/auth/webauthn";
import { getVaultRecordRevealed } from "@/domains/vault/service";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const owner = await requireOwner();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!(await requireStepUp())) return NextResponse.json({ error: "Step-up required" }, { status: 401 });
  const ip = ipFromRequest(request);
  if (!rateLimit(`vault-reveal:${ip}`, 20, 60 * 1000)) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  const { id } = await params;
  const record = await getVaultRecordRevealed(id);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await recordAuditEvent({ actorId: owner.id, action: "vault_reveal", resourceType: "vault_record", resourceId: id, ip });
  return NextResponse.json(record);
}
