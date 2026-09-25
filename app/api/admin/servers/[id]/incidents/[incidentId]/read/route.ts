import { NextResponse } from "next/server";
import { requireOwner } from "@/domains/auth/service";
import { markIncidentRead } from "@/domains/servers/service";
export async function PATCH(_: Request, { params }: { params: Promise<{ id: string; incidentId: string }> }) {
  if (!(await requireOwner())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { incidentId } = await params;
  await markIncidentRead(incidentId);
  return NextResponse.json({ ok: true });
}
