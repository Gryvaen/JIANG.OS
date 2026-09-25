import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { loadNotificationFeed } from "@/domains/servers/service";
export async function GET() {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await loadNotificationFeed();
  return NextResponse.json(result);
}
