package client

import "testing"

// This is the same fixed vector asserted in tests/agent-auth.test.ts's
// "cross-language fixed vector" case — it is the correctness gate for the
// TS/Go signing schemes staying byte-for-byte identical.
const (
	fixedRawToken  = "raw-secret"
	fixedTokenHash = "96820dfd08df73515beece5adfea687bed8e38234e63ff1b8251d5d20af172e4"
	fixedMethod    = "POST"
	fixedPath      = "/api/agent/v1/heartbeat"
	fixedTimestamp = "1700000000"
	fixedNonce     = "fixed-nonce-000000"
	fixedBody      = `{"cpuPercent":42.5}`
	fixedSignature = "f4af8f28e33af485609ab0054fa99568f38498de848de586abfa41f5f60c9b85"
)

func TestDeriveTokenHashMatchesFixedVector(t *testing.T) {
	if got := DeriveTokenHash(fixedRawToken); got != fixedTokenHash {
		t.Fatalf("DeriveTokenHash() = %q, want %q", got, fixedTokenHash)
	}
}

func TestSignMatchesFixedVector(t *testing.T) {
	got := Sign(fixedTokenHash, fixedMethod, fixedPath, fixedTimestamp, fixedNonce, fixedBody)
	if got != fixedSignature {
		t.Fatalf("Sign() = %q, want %q", got, fixedSignature)
	}
}

func TestSignChangesWithTamperedBody(t *testing.T) {
	got := Sign(fixedTokenHash, fixedMethod, fixedPath, fixedTimestamp, fixedNonce, `{"cpuPercent":99}`)
	if got == fixedSignature {
		t.Fatal("expected a different signature for a tampered body")
	}
}
