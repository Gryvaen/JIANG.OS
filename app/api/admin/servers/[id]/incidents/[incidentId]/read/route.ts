import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { markIncidentRead } from "@/domains/servers/service";
async function owner() { return (await auth())?.user as { role?: string } | undefined }
export async function PATCH(_: Request, { params }: { params: Promise<{ id: string; incidentId: string }> }) {
  if ((await owner())?.role !== "owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { incidentId } = await params;
  await markIncidentRead(incidentId);
  return NextResponse.json({ ok: true });
}
