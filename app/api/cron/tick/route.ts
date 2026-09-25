import { NextResponse } from "next/server";
import { runMaintenanceSweep } from "@/domains/servers/service";
export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token || token !== process.env.MAINTENANCE_TASK_TOKEN) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await runMaintenanceSweep();
  return NextResponse.json({ ok: true });
}
