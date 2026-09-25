import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/domains/audit/service";
import { isSameOrigin } from "@/domains/auth/csrf";
import { requireOwner, requireStepUp } from "@/domains/auth/service";
import { ipFromRequest } from "@/domains/auth/webauthn";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const owner = await requireOwner();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!(await requireStepUp())) return NextResponse.json({ error: "Step-up required" }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => null) as { field?: string } | null;
  await recordAuditEvent({ actorId: owner.id, action: "vault_copy", resourceType: "vault_record", resourceId: id, metadata: { field: body?.field ?? "unknown" }, ip: ipFromRequest(request) });
  return NextResponse.json({ ok: true });
}
