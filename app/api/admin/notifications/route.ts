import { NextResponse } from "next/server";
import { requireOwner } from "@/domains/auth/service";
import { loadNotificationFeed } from "@/domains/servers/service";
export async function GET() {
  if (!(await requireOwner())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await loadNotificationFeed();
  return NextResponse.json(result);
}
