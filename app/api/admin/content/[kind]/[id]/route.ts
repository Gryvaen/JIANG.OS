import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireOwner } from "@/domains/auth/service";
import { getDb } from "@/infrastructure/db/client";
import { notes, projects, quickLinks } from "@/infrastructure/db/schema";
import { noteUpdate, projectUpdate, quickLinkUpdate } from "../../schemas";
function definedEntries<T extends object>(data: T) { return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)) }
export async function PATCH(request: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  if (!(await requireOwner())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { kind, id } = await params;
  const body = await request.json().catch(() => null);
  if (kind === "projects") {
    const parsed = projectUpdate.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
    const data = definedEntries(parsed.data);
    const db = getDb();
    const [updated] = await db.update(projects).set({ ...data, updatedAt: new Date() }).where(eq(projects.id, id)).returning();
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  }
  if (kind === "notes") {
    const parsed = noteUpdate.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
    const data = definedEntries(parsed.data) as typeof parsed.data;
    const db = getDb();
    const [updated] = await db.update(notes).set({ ...data, ...(data.published !== undefined ? { publishedAt: data.published ? new Date() : null } : {}), updatedAt: new Date() }).where(eq(notes.id, id)).returning();
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  }
  if (kind === "quicklinks") {
    const parsed = quickLinkUpdate.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
    const data = definedEntries(parsed.data);
    const db = getDb();
    const [updated] = await db.update(quickLinks).set({ ...data, updatedAt: new Date() }).where(eq(quickLinks.id, id)).returning();
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  }
  return NextResponse.json({ error: "Unknown content type" }, { status: 404 });
}
export async function DELETE(_: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  if (!(await requireOwner())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { kind, id } = await params;
  const db = getDb();
  if (kind === "projects") await db.delete(projects).where(eq(projects.id, id));
  else if (kind === "notes") await db.delete(notes).where(eq(notes.id, id));
  else if (kind === "quicklinks") await db.delete(quickLinks).where(eq(quickLinks.id, id));
  else return NextResponse.json({ error: "Unknown content type" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
