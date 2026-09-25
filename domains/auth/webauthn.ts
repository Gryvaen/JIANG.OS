import { cookies } from "next/headers";
export const RP_NAME="JIANG.OS";
export function rpIdFromRequest(request:Request):string{return new URL(request.url).hostname}
export function originFromRequest(request:Request):string{return new URL(request.url).origin}

const CHALLENGE_COOKIE="jiang-os-webauthn-challenge";
export async function stashChallenge(challenge:string):Promise<void>{const jar=await cookies();jar.set(CHALLENGE_COOKIE,challenge,{httpOnly:true,secure:true,sameSite:"strict",maxAge:300,path:"/"})}
export async function consumeChallenge():Promise<string|null>{const jar=await cookies();const value=jar.get(CHALLENGE_COOKIE)?.value??null;jar.delete(CHALLENGE_COOKIE);return value}

export function ipFromRequest(request:Request):string{return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()??"unknown"}
