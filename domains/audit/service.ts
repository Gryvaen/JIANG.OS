import { getDb } from "@/infrastructure/db/client";
import { auditEvents } from "@/infrastructure/db/schema";

export interface AuditEventInput { actorId:string; action:string; resourceType?:string; resourceId?:string; metadata?:Record<string,unknown>; ip?:string }

export async function recordAuditEvent(input:AuditEventInput):Promise<void>{
  const db=getDb();
  await db.insert(auditEvents).values({actorId:input.actorId,action:input.action,resourceType:input.resourceType??"",resourceId:input.resourceId,metadata:input.metadata??{},ip:input.ip});
}
