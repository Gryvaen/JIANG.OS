import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import type { RegistrationResponseJSON } from "@simplewebauthn/types";
import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/domains/audit/service";
import { insertWebauthnCredential, requireOwner } from "@/domains/auth/service";
import { isSameOrigin } from "@/domains/auth/csrf";
import { consumeChallenge, ipFromRequest, originFromRequest, rpIdFromRequest } from "@/domains/auth/webauthn";
export async function POST(request: Request) {
  const owner = await requireOwner();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const body = await request.json().catch(() => null) as { response?: RegistrationResponseJSON; deviceLabel?: string } | null;
  if (!body?.response) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const challenge = await consumeChallenge();
  if (!challenge) return NextResponse.json({ error: "Challenge expired" }, { status: 400 });
  const result = await verifyRegistrationResponse({ response: body.response, expectedChallenge: challenge, expectedOrigin: originFromRequest(request), expectedRPID: rpIdFromRequest(request) }).catch(() => null);
  if (!result?.verified || !result.registrationInfo) return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  const { credentialID, credentialPublicKey, counter } = result.registrationInfo;
  const created = await insertWebauthnCredential({ credentialId: isoBase64URL.fromBuffer(credentialID), publicKey: isoBase64URL.fromBuffer(credentialPublicKey), counter, deviceLabel: body.deviceLabel?.trim() || "Passkey", transports: body.response.response.transports ?? [] });
  await recordAuditEvent({ actorId: owner.id, action: "passkey_registered", resourceType: "webauthn_credential", resourceId: created.id, ip: ipFromRequest(request) });
  return NextResponse.json({ ok: true, id: created.id, deviceLabel: created.deviceLabel });
}
