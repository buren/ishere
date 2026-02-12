# IsHere

A fast, edge-deployed link shortening service built with [Hono](https://hono.dev) on [Cloudflare Workers](https://workers.cloudflare.com).

## Features

- **No propagation delay** — links work immediately after creation, even across regions (see [Architecture](#architecture))
- **Custom short paths** — define your own paths or let them auto-generate (`/abc12`, `/your-brand/campaign`)
- **Namespaces** — organize links under a namespace prefix
- **QR codes** — append `/qr` to any short link for SVG, PNG, or HTML output
- **Analytics** — per-link redirect stats with bot detection, grouped by hour or day
- **Link expiration** — optional TTL-based expiry with automatic cleanup
- **Slack integration** — create short links via slash commands
- **OpenAPI docs** — interactive API reference at `/docs`

## Quick Start

### Prerequisites

- Node.js
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) with Workers, KV, D1, and Analytics Engine enabled

### Setup

```bash
npm install
npm run generate-types
cp .dev.vars.template .dev.vars   # add your API_KEY
```

Create KV and D1 resources:

```bash
npx wrangler kv namespace create ishere
npx wrangler d1 create ishere
```

Update `wrangler.jsonc` with the IDs from the commands above, then run migrations:

```bash
npx wrangler d1 migrations apply ishere --local
```

Start the dev server:

```bash
npm run dev
```

## API

### Link CRUD (auth required)

| Method   | Path                          | Description              |
| -------- | ----------------------------- | ------------------------ |
| `POST`   | `/api/link`                   | Create short link        |
| `GET`    | `/api/link/:id`               | Get short link           |
| `PATCH`  | `/api/link/:id`               | Update short link        |
| `DELETE` | `/api/link/:id`               | Delete short link        |
| `GET`    | `/api/link/:id/stats/:groupBy`| Get link stats (day/hour)|

### Redirects (no auth)

| Method | Path                        | Description                     |
| ------ | --------------------------- | ------------------------------- |
| `GET`  | `/:id`                      | Redirect to destination         |
| `GET`  | `/:namespace/:shortPath`    | Redirect (namespaced)           |
| `GET`  | `/:id/qr`                   | QR code for short link          |
| `GET`  | `/:namespace/:shortPath/qr` | QR code (namespaced)            |

### Other

| Method | Path                  | Auth | Description              |
| ------ | --------------------- | ---- | ------------------------ |
| `GET`  | `/api/health`         | No   | Health check             |
| `POST` | `/api/slack/command`   | No   | Slack slash command       |
| `GET`  | `/docs`               | No   | Interactive API reference |
| `GET`  | `/openapi.json`       | No   | OpenAPI spec              |

Auth is via the `X-API-KEY` header.

## Usage Examples

**Create a short link:**

```bash
curl https://your-domain/api/link \
  --request POST \
  --header 'X-API-KEY: yourapikey' \
  --json '{ "destinationUrl": "https://example.com" }'
```

**Create with custom namespace and path:**

```bash
curl https://your-domain/api/link \
  --request POST \
  --header 'X-API-KEY: yourapikey' \
  --json '{ "destinationUrl": "https://example.com", "namespace": "brand", "shortPath": "campaign" }'
```

**Update a link:**

```bash
curl https://your-domain/api/link/abc12 \
  --request PATCH \
  --header 'X-API-KEY: yourapikey' \
  --json '{ "destinationUrl": "https://new-url.com" }'
```

**Delete a link:**

```bash
curl https://your-domain/api/link/abc12 \
  --request DELETE \
  --header 'X-API-KEY: yourapikey'
```

**Get stats:**

```bash
curl https://your-domain/api/link/abc12/stats/day \
  --header 'X-API-KEY: yourapikey'
```

## Configuration

| Variable                   | Required | Description                                              |
| -------------------------- | -------- | -------------------------------------------------------- |
| `API_KEY`                  | Yes      | Secret key for authenticating API requests               |
| `ANALYTICS_API_TOKEN`      | Yes      | Cloudflare API token for querying Analytics Engine        |
| `DEFAULT_SHORT_PATH_LENGTH`| No       | Length of auto-generated short paths (default: `5`)      |
| `MAX_SHORT_ID_RETRIES`     | No       | Max retries on ID collision (default: `5`)               |

Set secrets locally in `.dev.vars` and via `wrangler secret put` for deployed environments.

## Architecture

```
Routes (src/routes/) → Actions (src/actions/) → KV (src/kv/) + D1 (src/db/)
```

- **Routes** define endpoints with Zod schema validation via `@hono/zod-openapi`
- **Actions** contain business logic, decoupled from HTTP concerns
- **D1** is the source of truth; **KV** serves as a global edge cache for fast reads
- Reads try KV first, falling back to D1 on cache miss — this means links are available immediately after creation, avoiding the ~60s propagation delay that KV-only link shorteners suffer from
- Analytics are tracked via Cloudflare Analytics Engine on each redirect
- A cron trigger runs hourly to clean up expired links

## Testing

```bash
npm test              # watch mode
npx vitest run        # single run
npx vitest run test/api/links/create-link.spec.ts   # single file
```

Tests use `@cloudflare/vitest-pool-workers` with local KV and D1 bindings.

## Deployment

```bash
npm run deploy:preview      # deploy to preview environment
npm run deploy:production   # deploy to production
```
