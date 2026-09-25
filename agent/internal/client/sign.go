// Package client implements the agent side of the HMAC-SHA256 request
// signing scheme shared with domains/servers/agent-auth.ts on the server.
// The canonical string and signing algorithm here must match that file
// byte-for-byte; see sign_test.go for a fixed cross-language test vector.
package client

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
)

// CanonicalString builds the string that gets HMAC-signed:
// method\npath\ntimestamp\nnonce\nsha256(body)
func CanonicalString(method, path, timestamp, nonce, body string) string {
	bodyHash := sha256.Sum256([]byte(body))
	return method + "\n" + path + "\n" + timestamp + "\n" + nonce + "\n" + hex.EncodeToString(bodyHash[:])
}

// Sign computes the hex HMAC-SHA256 signature of the canonical string using
// tokenHash (itself sha256(rawToken)) as the key.
func Sign(tokenHash, method, path, timestamp, nonce, body string) string {
	mac := hmac.New(sha256.New, []byte(tokenHash))
	mac.Write([]byte(CanonicalString(method, path, timestamp, nonce, body)))
	return hex.EncodeToString(mac.Sum(nil))
}

// DeriveTokenHash computes sha256(rawToken) as a hex string, matching
// domains/servers/agent-auth.ts's deriveTokenHash.
func DeriveTokenHash(rawToken string) string {
	sum := sha256.Sum256([]byte(rawToken))
	return hex.EncodeToString(sum[:])
}
