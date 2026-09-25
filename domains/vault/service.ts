import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/infrastructure/db/client";
import { vaultRecords } from "@/infrastructure/db/schema";
import { decryptVaultFields, encryptVaultFields } from "./crypto";
import type { VaultRecordInput, VaultRecordRevealed, VaultRecordSummary } from "./types";

type VaultRecordRow = typeof vaultRecords.$inferSelect;
interface EncryptedFieldSet { redactedAddress:string; username:string; port:number|null; notes:string; managerRef:string; sshCommandTemplate:string }

export function shapeVaultSummary(row:VaultRecordRow):VaultRecordSummary{return {id:String(row.id),alias:row.alias,provider:row.provider,tags:row.tags||[],archivedAt:row.archivedAt?row.archivedAt.toISOString():null,updatedAt:row.updatedAt.toISOString()}}
function shapeVaultRevealed(row:VaultRecordRow):VaultRecordRevealed{const fields=decryptVaultFields<EncryptedFieldSet>(row.encryptedFields,row.encryptionNonce,row.keyVersion);return {...shapeVaultSummary(row),...fields}}
function encryptInput(input:VaultRecordInput):{encryptedFields:string;encryptionNonce:string;keyVersion:number}{const {ciphertext,nonce,keyVersion}=encryptVaultFields({redactedAddress:input.redactedAddress,username:input.username,port:input.port,notes:input.notes,managerRef:input.managerRef,sshCommandTemplate:input.sshCommandTemplate});return {encryptedFields:ciphertext,encryptionNonce:nonce,keyVersion}}

export async function listVaultRecords(includeArchived?:boolean):Promise<VaultRecordSummary[]>{
  const db=getDb();
  const rows=await db.select().from(vaultRecords).where(includeArchived?isNull(vaultRecords.deletedAt):and(isNull(vaultRecords.deletedAt),isNull(vaultRecords.archivedAt))).orderBy(desc(vaultRecords.updatedAt));
  return rows.map(shapeVaultSummary);
}
export async function getVaultRecordMasked(id:string):Promise<VaultRecordSummary|null>{
  const db=getDb();
  const [row]=await db.select().from(vaultRecords).where(and(eq(vaultRecords.id,id),isNull(vaultRecords.deletedAt)));
  return row?shapeVaultSummary(row):null;
}
export async function getVaultRecordRevealed(id:string):Promise<VaultRecordRevealed|null>{
  const db=getDb();
  const [row]=await db.select().from(vaultRecords).where(and(eq(vaultRecords.id,id),isNull(vaultRecords.deletedAt)));
  return row?shapeVaultRevealed(row):null;
}
export async function createVaultRecord(input:VaultRecordInput):Promise<VaultRecordSummary>{
  const db=getDb();
  const {encryptedFields,encryptionNonce,keyVersion}=encryptInput(input);
  const [row]=await db.insert(vaultRecords).values({alias:input.alias,provider:input.provider,tags:input.tags,encryptedFields,encryptionNonce,keyVersion}).returning();
  return shapeVaultSummary(row);
}
export async function updateVaultRecord(id:string,input:Partial<VaultRecordInput>):Promise<VaultRecordSummary|null>{
  const db=getDb();
  const existing=await getVaultRecordRevealed(id);
  if(!existing)return null;
  const merged:VaultRecordInput={alias:input.alias??existing.alias,provider:input.provider??existing.provider,tags:input.tags??existing.tags,redactedAddress:input.redactedAddress??existing.redactedAddress,username:input.username??existing.username,port:input.port!==undefined?input.port:existing.port,notes:input.notes??existing.notes,managerRef:input.managerRef??existing.managerRef,sshCommandTemplate:input.sshCommandTemplate??existing.sshCommandTemplate};
  const {encryptedFields,encryptionNonce,keyVersion}=encryptInput(merged);
  const [row]=await db.update(vaultRecords).set({alias:merged.alias,provider:merged.provider,tags:merged.tags,encryptedFields,encryptionNonce,keyVersion,updatedAt:new Date()}).where(eq(vaultRecords.id,id)).returning();
  return row?shapeVaultSummary(row):null;
}
export async function archiveVaultRecord(id:string):Promise<void>{
  const db=getDb();
  await db.update(vaultRecords).set({archivedAt:new Date(),updatedAt:new Date()}).where(eq(vaultRecords.id,id));
}
export async function restoreVaultRecord(id:string):Promise<void>{
  const db=getDb();
  await db.update(vaultRecords).set({archivedAt:null,updatedAt:new Date()}).where(eq(vaultRecords.id,id));
}
export async function softDeleteVaultRecord(id:string):Promise<void>{
  const db=getDb();
  await db.update(vaultRecords).set({deletedAt:new Date(),updatedAt:new Date()}).where(eq(vaultRecords.id,id));
}
