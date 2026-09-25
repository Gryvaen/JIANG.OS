import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { markIncidentRead } from "@/domains/servers/service";
export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await markIncidentRead(id);
  return NextResponse.json({ ok: true });
}
