import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/domains/audit/service";
import { isSameOrigin } from "@/domains/auth/csrf";
import { deleteWebauthnCredential, requireOwner } from "@/domains/auth/service";
import { ipFromRequest } from "@/domains/auth/webauthn";
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const owner = await requireOwner();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const { id } = await params;
  await deleteWebauthnCredential(id);
  await recordAuditEvent({ actorId: owner.id, action: "passkey_revoked", resourceType: "webauthn_credential", resourceId: id, ip: ipFromRequest(request) });
  return NextResponse.json({ ok: true });
}
