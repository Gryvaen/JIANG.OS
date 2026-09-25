import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getDb } from "@/infrastructure/db/client";
import { projects } from "@/infrastructure/db/schema";
const reorderInput = z.object({ order: z.array(z.string()).min(1) });
export async function PATCH(request: Request) {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = reorderInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const db = getDb();
  await db.transaction(async tx => {
    await Promise.all(parsed.data.order.map((id, index) => tx.update(projects).set({ sortOrder: index, updatedAt: new Date() }).where(eq(projects.id, id))));
  });
  return NextResponse.json({ ok: true });
}
