# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IsHere is a link shortening service built with **Hono** (TypeScript) running on **Cloudflare Workers**. It uses Cloudflare KV for fast edge-cached reads, D1 (SQLite) for persistent storage, and Analytics Engine for redirect tracking.

## Commands

- `npm run dev` — Start local dev server (wrangler dev)
- `npm test` — Run tests (vitest in watch mode)
- `npx vitest run` — Run tests once (used in CI)
- `npx vitest run test/api/links/create-link.spec.ts` — Run a single test file
- `npm run generate-types` — Generate TypeScript types from wrangler.jsonc bindings

## Architecture

### Layered Request Flow

```
src/index.ts (Worker entry) → src/routes/ (Hono OpenAPI routes) → src/actions/ (business logic) → src/kv/ + src/db/ (data access)
```

1. **Routes** (`src/routes/`): Hono OpenAPI route definitions with Zod schema validation. Routes are grouped into `api/links/`, `api/slack/`, `api/health/`, and `redirects/`.
2. **Actions** (`src/actions/`): Business logic layer. Each action follows the `Action<TBody, TResponseBody>` type signature, receiving `{url, data, env, ctx}` and returning `{data: T}`.
3. **Data Access**: Dual storage — **KV** (`src/kv/`) for fast reads, **D1** (`src/db/`) for persistence. Read path tries KV first, falls back to D1 (`src/utils/get-link-with-d1-fallback.ts`).
4. **Analytics** (`src/analytics/`): Redirect tracking via Cloudflare Analytics Engine, captures UA, geo, bot detection.

### Key Routing

- `/api/link` — CRUD operations (auth required via `Authorization: Bearer` header)
- `/api/slack/command` — Slack slash command handler
- `/api/health` — Health check
- `/:id` and `/:namespace/:shortPath` — Redirect resolution (no auth)
- Append `/qr` to any redirect path for QR code generation
- `/docs` — Scalar API reference UI, `/openapi.json` — OpenAPI spec

### Link ID Resolution

Short IDs are alphanumeric + `-_` (3–100 chars). When both namespace and shortPath are provided, the stored ID is `{namespace}-{shortPath}`. Reserved paths defined in `src/actions/constants.ts`.

### Auth

Middleware in `src/middleware/auth.ts` checks the `Authorization: Bearer` header against `env.API_KEY`. Applied to `/api/link` routes only.

### Schemas

Zod schemas in `src/schema/` drive both request/response validation and OpenAPI doc generation via `@hono/zod-openapi`.

## Testing

Tests use **Vitest** with `@cloudflare/vitest-pool-workers`. The test pool spins up a miniflare worker with KV and D1 bindings. D1 migrations from `migrations/` are applied via `test/apply-migrations.ts` setup file. Tests make HTTP requests using the `SELF` helper from the workers pool. Tests mirror the `src/` structure under `test/`.

## Cloudflare Bindings (wrangler.jsonc)

- **KV** — Key-value namespace for link cache
- **D1** — SQL database for link persistence
- **REDIRECTS** — Analytics Engine dataset
- **API_KEY** — Secret (set in `.dev.vars` locally)
- Cron trigger runs hourly (for cleanup of expired links)
