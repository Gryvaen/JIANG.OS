import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/domains/audit/service";
import { isSameOrigin } from "@/domains/auth/csrf";
import { requireOwner, requireStepUp } from "@/domains/auth/service";
import { ipFromRequest } from "@/domains/auth/webauthn";
import { getVaultRecordMasked, softDeleteVaultRecord, updateVaultRecord } from "@/domains/vault/service";
import { vaultRecordUpdate } from "../../schemas";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const owner = await requireOwner();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await requireStepUp())) return NextResponse.json({ error: "Step-up required" }, { status: 401 });
  const { id } = await params;
  const record = await getVaultRecordMasked(id);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(record);
}
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const owner = await requireOwner();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!(await requireStepUp())) return NextResponse.json({ error: "Step-up required" }, { status: 401 });
  const { id } = await params;
  const parsed = vaultRecordUpdate.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  const updated = await updateVaultRecord(id, parsed.data);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await recordAuditEvent({ actorId: owner.id, action: "vault_update", resourceType: "vault_record", resourceId: id, ip: ipFromRequest(request) });
  return NextResponse.json(updated);
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const owner = await requireOwner();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!(await requireStepUp())) return NextResponse.json({ error: "Step-up required" }, { status: 401 });
  const { id } = await params;
  await softDeleteVaultRecord(id);
  await recordAuditEvent({ actorId: owner.id, action: "vault_delete", resourceType: "vault_record", resourceId: id, ip: ipFromRequest(request) });
  return NextResponse.json({ ok: true });
}
