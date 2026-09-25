import { createHmac, timingSafeEqual } from "crypto";
const STEPUP_TTL_SECONDS=300;
function secret():string{const raw=process.env.STEPUP_SESSION_SECRET;if(!raw)throw new Error("STEPUP_SESSION_SECRET is not configured");return raw}
function sign(payload:string):string{return createHmac("sha256",secret()).update(payload).digest("hex")}

export function issueStepUpToken(ownerId:string,now:number=Date.now()/1000):string{
  const payload=JSON.stringify({sub:ownerId,iat:Math.floor(now),exp:Math.floor(now)+STEPUP_TTL_SECONDS});
  const payloadB64=Buffer.from(payload,"utf8").toString("base64url");
  return `${payloadB64}.${sign(payloadB64)}`;
}
export function verifyStepUpToken(token:string|undefined,now:number=Date.now()/1000):boolean{
  if(!token)return false;
  const [payloadB64,signature]=token.split(".");
  if(!payloadB64||!signature)return false;
  let expected:Buffer,actual:Buffer;
  try{expected=Buffer.from(sign(payloadB64),"hex");actual=Buffer.from(signature,"hex")}catch{return false}
  if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return false;
  try{
    const payload=JSON.parse(Buffer.from(payloadB64,"base64url").toString("utf8")) as {sub:string;iat:number;exp:number};
    return typeof payload.exp==="number"&&now<=payload.exp;
  }catch{
    return false;
  }
}
