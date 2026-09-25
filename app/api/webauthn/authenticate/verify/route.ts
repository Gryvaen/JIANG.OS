import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import type { AuthenticationResponseJSON, AuthenticatorTransportFuture } from "@simplewebauthn/types";
import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/domains/audit/service";
import { isSameOrigin } from "@/domains/auth/csrf";
import { rateLimit } from "@/domains/auth/rate-limit";
import { getWebauthnCredentialByCredentialId, requireOwner, setStepUpCookie, touchWebauthnCredential } from "@/domains/auth/service";
import { issueStepUpToken } from "@/domains/auth/stepup";
import { consumeChallenge, ipFromRequest, originFromRequest, rpIdFromRequest } from "@/domains/auth/webauthn";
export async function POST(request: Request) {
  const owner = await requireOwner();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const ip = ipFromRequest(request);
  if (!rateLimit(`webauthn-auth-verify:${ip}`, 5, 5 * 60 * 1000)) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  const body = await request.json().catch(() => null) as { response?: AuthenticationResponseJSON } | null;
  const challenge = await consumeChallenge();
  if (!body?.response || !challenge) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const credential = await getWebauthnCredentialByCredentialId(body.response.id);
  if (!credential) { await recordAuditEvent({ actorId: owner.id, action: "stepup_failure", resourceType: "webauthn_credential", ip }); return NextResponse.json({ error: "Unknown credential" }, { status: 401 }); }
  const result = await verifyAuthenticationResponse({
    response: body.response,
    expectedChallenge: challenge,
    expectedOrigin: originFromRequest(request),
    expectedRPID: rpIdFromRequest(request),
    authenticator: { credentialID: isoBase64URL.toBuffer(credential.credentialId), credentialPublicKey: isoBase64URL.toBuffer(credential.publicKey), counter: credential.counter, transports: credential.transports as AuthenticatorTransportFuture[] }
  }).catch(() => null);
  if (!result?.verified) { await recordAuditEvent({ actorId: owner.id, action: "stepup_failure", resourceType: "webauthn_credential", resourceId: credential.id, ip }); return NextResponse.json({ error: "Verification failed" }, { status: 401 }); }
  await touchWebauthnCredential(credential.id, result.authenticationInfo.newCounter);
  await setStepUpCookie(issueStepUpToken(owner.id));
  await recordAuditEvent({ actorId: owner.id, action: "stepup_success", resourceType: "webauthn_credential", resourceId: credential.id, ip });
  return NextResponse.json({ ok: true });
}
