import { asc, eq } from "drizzle-orm";
import { getDb } from "@/infrastructure/db/client";
import { quickLinks } from "@/infrastructure/db/schema";
import type { QuickLink } from "./types";

type QuickLinkRow = typeof quickLinks.$inferSelect;
export function shapeQuickLink(row:QuickLinkRow):QuickLink{return {...row,id:String(row.id),keywords:row.keywords||[]}}

export async function loadQuickLinks():Promise<{quickLinks:QuickLink[];mode:"live"|"unavailable"}>{
  try{
    const db=getDb();
    const rows=await db.select().from(quickLinks).where(eq(quickLinks.enabled,true)).orderBy(asc(quickLinks.groupLabel),asc(quickLinks.sortOrder));
    return {quickLinks:rows.map(shapeQuickLink),mode:"live"};
  }catch{
    return {quickLinks:[],mode:"unavailable"};
  }
}

// Admin-only: unlike loadQuickLinks(), this deliberately returns disabled rows
// too, because "re-enable a disabled link" is a core, repeated admin workflow.
// Throws on DB failure — caller (app/admin/page.tsx) already gates rendering
// on mode==="live" before calling this.
export async function loadAllQuickLinksForAdmin():Promise<QuickLink[]>{
  const db=getDb();
  const rows=await db.select().from(quickLinks).orderBy(asc(quickLinks.groupLabel),asc(quickLinks.sortOrder));
  return rows.map(shapeQuickLink);
}
