# jiang-os-agent

Lightweight metrics/heartbeat agent for JIANG.OS's Servers monitoring (Phase 4).
Reports CPU/memory/disk/load/uptime on an interval and runs any configured
local service checks (currently `process` checks by name).

## Install

1. Build or download the `jiang-os-agent` binary (`go build .` in this directory,
   or use `deploy/Dockerfile`).
2. In the JIANG.OS admin UI, add the server and issue an agent token
   (`POST /api/admin/servers/:id/token`). The raw token is shown **once** —
   copy it immediately.
3. Copy `config.example.yaml` to `/etc/jiang-os-agent/config.yaml`, fill in
   `server_url`, `token_id`, and `token`, and `chmod 600` the file (it holds
   the raw secret).
4. Install `deploy/systemd/jiang-os-agent.service` to
   `/etc/systemd/system/`, then:
   ```
   sudo systemctl daemon-reload
   sudo systemctl enable --now jiang-os-agent
   ```

## Config

See `config.example.yaml`. `heartbeat_interval_seconds` defaults to 30 if
omitted or invalid. `service_checks[].type` currently supports `process`
(matched by exact process name); `http`/`tcp` checks are configured and run
server-side instead (see `/api/admin/servers` and the maintenance sweep).

## Token rotation

Revoking a token (`DELETE /api/admin/servers/:id/token`) takes effect
immediately — the next heartbeat with the old token gets a `401 revoked`.
Issue a new token and update `config.yaml`'s `token`/`token_id`, then restart
the service.

## Signing scheme

Every request carries `X-Agent-Token-Id`, `X-Agent-Timestamp`,
`X-Agent-Nonce`, and `X-Agent-Signature` headers. The signature is an
HMAC-SHA256 over `method\npath\ntimestamp\nnonce\nsha256(body)`, keyed by
`sha256(rawToken)` — the raw token itself is never sent over the wire. This
must stay byte-for-byte identical to `domains/servers/agent-auth.ts` on the
server; `internal/client/sign_test.go` and `tests/agent-auth.test.ts` assert
the same fixed test vector to catch any drift between the two
implementations.
