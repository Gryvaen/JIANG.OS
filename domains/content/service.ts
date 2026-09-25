import { asc, eq } from "drizzle-orm";
import { getDb } from "@/infrastructure/db/client";
import { notes, profiles, projects } from "@/infrastructure/db/schema";
import { previewContent } from "./demo";
import type { LoadedContent, Note, Profile, Project } from "./types";

type ProjectRow = typeof projects.$inferSelect;
type NoteRow = typeof notes.$inferSelect;
type ProfileRow = typeof profiles.$inferSelect;

export function shapeProject(row:ProjectRow):Project{return {...row,id:String(row.id),links:row.links||[],stack:row.stack||[]}}
export function shapeNote(row:NoteRow):Note{return {...row,id:String(row.id),publishedAt:row.publishedAt?.toISOString()||null}}
export function shapeProfile(row:ProfileRow):Profile{return {...row,links:row.links||[]}}

export async function loadPublicContent():Promise<LoadedContent>{
  try{
    const db=getDb();
    const [projectRows,noteRows,profileRows]=await Promise.all([
      db.select().from(projects).where(eq(projects.published,true)).orderBy(asc(projects.sortOrder)),
      db.select().from(notes).where(eq(notes.published,true)),
      db.select().from(profiles).limit(1)
    ]);
    if(!profileRows[0])return {content:previewContent,mode:"preview"};
    return {content:{projects:projectRows.map(shapeProject),notes:noteRows.map(shapeNote),profile:shapeProfile(profileRows[0])},mode:"live"};
  }catch(error){
    return {content:previewContent,mode:"unavailable",error:error instanceof Error?error.message:"Unknown error"};
  }
}
