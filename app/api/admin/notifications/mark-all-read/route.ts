import { NextResponse } from "next/server";
import { requireOwner } from "@/domains/auth/service";
import { markAllIncidentsRead } from "@/domains/servers/service";
export async function POST() {
  if (!(await requireOwner())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await markAllIncidentsRead();
  return NextResponse.json({ ok: true });
}
