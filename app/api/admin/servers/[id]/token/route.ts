import { NextResponse } from "next/server";
import { requireOwner } from "@/domains/auth/service";
import { issueServerToken, revokeServerToken } from "@/domains/servers/service";
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireOwner())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const issued = await issueServerToken(id);
  return NextResponse.json(issued, { status: 201 });
}
export async function DELETE(request: Request) {
  if (!(await requireOwner())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { agentId } = await request.json().catch(() => ({}));
  if (!agentId) return NextResponse.json({ error: "agentId is required" }, { status: 400 });
  await revokeServerToken(agentId);
  return NextResponse.json({ ok: true });
}
