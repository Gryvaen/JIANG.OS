import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { getDb } from "@/infrastructure/db/client";
import { webauthnCredentials } from "@/infrastructure/db/schema";
import { verifyStepUpToken } from "./stepup";

export interface OwnerSession { role:"owner"; id:string }
export async function requireOwner():Promise<OwnerSession|null>{const session=await auth();return (session?.user as {role?:string}|undefined)?.role==="owner"?{role:"owner",id:String(process.env.OWNER_GITHUB_ID)}:null}

export const STEPUP_COOKIE="jiang-os-stepup";
export async function requireStepUp():Promise<boolean>{const jar=await cookies();return verifyStepUpToken(jar.get(STEPUP_COOKIE)?.value)}
export async function setStepUpCookie(token:string):Promise<void>{const jar=await cookies();jar.set(STEPUP_COOKIE,token,{httpOnly:true,secure:true,sameSite:"strict",maxAge:300,path:"/"})}
export async function clearStepUpCookie():Promise<void>{const jar=await cookies();jar.delete(STEPUP_COOKIE)}

type WebauthnCredentialRow = typeof webauthnCredentials.$inferSelect;
export async function listWebauthnCredentials():Promise<WebauthnCredentialRow[]>{const db=getDb();return db.select().from(webauthnCredentials).orderBy(webauthnCredentials.createdAt)}
export async function getWebauthnCredentialByCredentialId(credentialId:string):Promise<WebauthnCredentialRow|null>{const db=getDb();const [row]=await db.select().from(webauthnCredentials).where(eq(webauthnCredentials.credentialId,credentialId));return row??null}
export async function insertWebauthnCredential(input:{credentialId:string;publicKey:string;counter:number;deviceLabel:string;transports:string[]}):Promise<WebauthnCredentialRow>{const db=getDb();const [row]=await db.insert(webauthnCredentials).values(input).returning();return row}
export async function touchWebauthnCredential(id:string,counter:number):Promise<void>{const db=getDb();await db.update(webauthnCredentials).set({counter,lastUsedAt:new Date()}).where(eq(webauthnCredentials.id,id))}
export async function deleteWebauthnCredential(id:string):Promise<void>{const db=getDb();await db.delete(webauthnCredentials).where(eq(webauthnCredentials.id,id))}
