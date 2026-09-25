import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/domains/audit/service";
import { isSameOrigin } from "@/domains/auth/csrf";
import { requireOwner, requireStepUp } from "@/domains/auth/service";
import { ipFromRequest } from "@/domains/auth/webauthn";
import { createVaultRecord, listVaultRecords } from "@/domains/vault/service";
import { vaultRecordInput } from "../schemas";
export async function GET(request: Request) {
  const owner = await requireOwner();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await requireStepUp())) return NextResponse.json({ error: "Step-up required" }, { status: 401 });
  const includeArchived = new URL(request.url).searchParams.get("includeArchived") === "true";
  const records = await listVaultRecords(includeArchived);
  return NextResponse.json({ records });
}
export async function POST(request: Request) {
  const owner = await requireOwner();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!(await requireStepUp())) return NextResponse.json({ error: "Step-up required" }, { status: 401 });
  const parsed = vaultRecordInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  const created = await createVaultRecord(parsed.data);
  await recordAuditEvent({ actorId: owner.id, action: "vault_create", resourceType: "vault_record", resourceId: created.id, ip: ipFromRequest(request) });
  return NextResponse.json(created, { status: 201 });
}
