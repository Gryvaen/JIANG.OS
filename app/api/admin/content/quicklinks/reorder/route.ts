import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOwner } from "@/domains/auth/service";
import { getDb } from "@/infrastructure/db/client";
import { quickLinks } from "@/infrastructure/db/schema";
const reorderInput = z.object({ order: z.array(z.string()).min(1) });
export async function PATCH(request: Request) {
  if (!(await requireOwner())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = reorderInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const db = getDb();
  await db.transaction(async tx => {
    await Promise.all(parsed.data.order.map((id, index) => tx.update(quickLinks).set({ sortOrder: index, updatedAt: new Date() }).where(eq(quickLinks.id, id))));
  });
  return NextResponse.json({ ok: true });
}
