import { createHash, createHmac, timingSafeEqual } from "crypto";

export function deriveTokenHash(rawToken:string):string{return createHash("sha256").update(rawToken).digest("hex")}
export function canonicalString(method:string,path:string,timestamp:string,nonce:string,body:string):string{return `${method}\n${path}\n${timestamp}\n${nonce}\n${createHash("sha256").update(body).digest("hex")}`}
export function signRequest(tokenHash:string,method:string,path:string,timestamp:string,nonce:string,body:string):string{return createHmac("sha256",tokenHash).update(canonicalString(method,path,timestamp,nonce,body)).digest("hex")}

export type AuthFailure = "unknown_token" | "revoked" | "stale" | "invalid_signature" | "replay";

export function verifySignature(tokenHash:string,method:string,path:string,timestamp:string,nonce:string,body:string,signature:string):boolean{
  let expected:string;
  try{expected=signRequest(tokenHash,method,path,timestamp,nonce,body)}catch{return false}
  let a:Buffer,b:Buffer;
  try{a=Buffer.from(expected,"hex");b=Buffer.from(signature,"hex")}catch{return false}
  return a.length===b.length&&a.length>0&&timingSafeEqual(a,b);
}

export function isTimestampFresh(timestamp:string,now:number=Date.now()/1000,windowSeconds:number=Number(process.env.AGENT_TIME_WINDOW_SECONDS??300)):boolean{
  const t=Number(timestamp);
  return Number.isFinite(t)&&Math.abs(now-t)<=windowSeconds;
}

export interface AgentAuthHeaders { tokenId:string; timestamp:string; nonce:string; signature:string }
export function readAgentAuthHeaders(headers:Headers):AgentAuthHeaders|null{
  const tokenId=headers.get("x-agent-token-id");
  const timestamp=headers.get("x-agent-timestamp");
  const nonce=headers.get("x-agent-nonce");
  const signature=headers.get("x-agent-signature");
  if(!tokenId||!timestamp||!nonce||!signature)return null;
  return {tokenId,timestamp,nonce,signature};
}
