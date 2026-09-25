# JIANG.OS

Personal Web Operating System built with Next.js, React, TypeScript, PostgreSQL and Auth.js.

## Local development

1. Copy `.env.example` to `.env` and fill the GitHub OAuth credentials and owner GitHub numeric ID.
2. Start PostgreSQL with `docker compose up -d db`.
3. Run `npm install`, `npm run db:push`, then `npm run dev`.

The public OS is available at `/`; the owner-only control panel is at `/admin`.

Without a database connection, the public shell enters preview mode using the bundled read-only content snapshot. Production content is read from PostgreSQL.

## Roadmap

See [docs/IMPLEMENTATION_ROADMAP.md](docs/IMPLEMENTATION_ROADMAP.md) for the concrete Phase 3–6 implementation plan and release milestones.
