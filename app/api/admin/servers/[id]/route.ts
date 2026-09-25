import { NextResponse } from "next/server";
import { requireOwner } from "@/domains/auth/service";
import { deleteServer, loadServerDetail, updateServer } from "@/domains/servers/service";
import { serverUpdate } from "../schemas";
function definedEntries<T extends object>(data: T) { return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)) }
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireOwner())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const result = await loadServerDetail(id);
  if (!result.detail) return NextResponse.json({ error: "Not found", mode: result.mode }, { status: 404 });
  return NextResponse.json(result);
}
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireOwner())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = serverUpdate.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  const updated = await updateServer(id, definedEntries(parsed.data));
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireOwner())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await deleteServer(id);
  return NextResponse.json({ ok: true });
}
