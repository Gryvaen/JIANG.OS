import { NextResponse } from "next/server";
import { requireOwner } from "@/domains/auth/service";
import { markIncidentRead } from "@/domains/servers/service";
export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireOwner())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await markIncidentRead(id);
  return NextResponse.json({ ok: true });
}
