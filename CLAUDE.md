# CLAUDE.md

Project-specific rules for working in JIANG.OS. See `docs/IMPLEMENTATION_ROADMAP.md` for the larger phased feature roadmap (Search, Quick Web, Tools, Servers, Vault, Cover).

## Priority order

When implementing features or fixes, prioritize in this order: domain logic (`domains/`) > data model (`infrastructure/db/schema.ts`) > API contracts (`app/api/**/route.ts`) > state machines (`core/*`) > tests > UI polish.

**Visual/design-system decisions are explicitly out of scope.** The final visual design is owned by a separate, later pass (a different agent/tool). Do not invent new visual language, spacing scales, shadows, animations, or component "look" while doing structural or feature work. Keep UI functional, semantic, and responsive using the existing design tokens (`app/styles/tokens.css`) and primitives (`components/ui/`) — don't introduce one-off styling that a later visual pass would have to unwind.

## Layering rules

- `components/apps/**`, `components/os/**`, and `components/admin/**` must never import `infrastructure/db/*` or `drizzle-orm` directly. Only `domains/*/service.ts` and `app/api/**/route.ts` may touch the database.
- All business capability is exposed through `domains/*` types/functions (view models), never raw DB rows passed into components.
- Each App under `components/apps/` owns its own file (or directory if it grows sub-components). Cross-app imports go through `core/` or `domains/`, not directly between app files.
- `DesktopShell` and `MobileShell` must consume the same `core/` state (window reducer, command bus) and the same `domains/` data. Presentational differences between shells are expected and fine; duplicated business logic is not.

## Code style

- The codebase follows a dense, single-line-per-function convention in most existing files. Match this style in files you touch; don't reformat unrelated files as a side effect of an unrelated change.

## Testing discipline

- Any change to `core/window-reducer.ts`, `core/commands.ts`, or `core/app-registry.ts` requires a corresponding `describe`/`it` in `tests/`, following the existing pattern in `tests/core.test.ts` (Vitest, `describe/expect/it/vi`, no DOM/jsdom environment — keep new tests DOM-free unless a testing-library + jsdom setup is deliberately added first).
