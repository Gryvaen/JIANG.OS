import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { markAllIncidentsRead } from "@/domains/servers/service";
export async function POST() {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await markAllIncidentsRead();
  return NextResponse.json({ ok: true });
}
