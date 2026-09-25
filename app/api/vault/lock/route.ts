import { NextResponse } from "next/server";
import { clearStepUpCookie, requireOwner } from "@/domains/auth/service";
export async function POST() {
  if (!(await requireOwner())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await clearStepUpCookie();
  return NextResponse.json({ ok: true });
}
