import { NextResponse } from "next/server";
import { listWebauthnCredentials, requireOwner } from "@/domains/auth/service";
export async function GET() {
  if (!(await requireOwner())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await listWebauthnCredentials();
  return NextResponse.json(rows.map(r => ({ id: r.id, deviceLabel: r.deviceLabel, lastUsedAt: r.lastUsedAt?.toISOString() ?? null, createdAt: r.createdAt.toISOString() })));
}
