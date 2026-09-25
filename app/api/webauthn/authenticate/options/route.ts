import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/types";
import { NextResponse } from "next/server";
import { rateLimit } from "@/domains/auth/rate-limit";
import { listWebauthnCredentials, requireOwner } from "@/domains/auth/service";
import { ipFromRequest, rpIdFromRequest, stashChallenge } from "@/domains/auth/webauthn";
export async function POST(request: Request) {
  const owner = await requireOwner();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!rateLimit(`webauthn-auth-options:${ipFromRequest(request)}`, 5, 5 * 60 * 1000)) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  const existing = await listWebauthnCredentials();
  const options = await generateAuthenticationOptions({
    rpID: rpIdFromRequest(request),
    userVerification: "preferred",
    allowCredentials: existing.map(c => ({ id: isoBase64URL.toBuffer(c.credentialId), type: "public-key" as const, transports: c.transports as AuthenticatorTransportFuture[] }))
  });
  await stashChallenge(options.challenge);
  return NextResponse.json(options);
}
