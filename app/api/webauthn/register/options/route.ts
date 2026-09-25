import { generateRegistrationOptions } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/types";
import { NextResponse } from "next/server";
import { listWebauthnCredentials, requireOwner } from "@/domains/auth/service";
import { rpIdFromRequest, RP_NAME, stashChallenge } from "@/domains/auth/webauthn";
export async function POST(request: Request) {
  const owner = await requireOwner();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const existing = await listWebauthnCredentials();
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: rpIdFromRequest(request),
    userID: isoBase64URL.fromString(owner.id),
    userName: "owner",
    userDisplayName: "Owner",
    attestationType: "none",
    excludeCredentials: existing.map(c => ({ id: isoBase64URL.toBuffer(c.credentialId), type: "public-key" as const, transports: c.transports as AuthenticatorTransportFuture[] })),
    authenticatorSelection: { residentKey: "preferred", userVerification: "preferred" }
  });
  await stashChallenge(options.challenge);
  return NextResponse.json(options);
}
