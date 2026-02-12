# IsHere

A fast, edge-deployed link shortening service built with [Hono](https://hono.dev) on [Cloudflare Workers](https://workers.cloudflare.com).

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/buren/ishere)

## Features

- **Custom short paths** — define your own paths or let them auto-generate (`/abc12`, `/your-brand/campaign`)
- **Namespaces** — organize links under a namespace prefix
- **QR codes** — append `/qr` to any short link for SVG, PNG, or HTML output
- **Analytics** — per-link redirect stats with bot detection, grouped by hour or day
- **Link expiration** — optional TTL-based expiry with automatic cleanup
- **Slack integration** — slash commands, bot notifications on link create/update, interactive buttons for stats and details
- **OpenAPI docs** — interactive API reference at `/`
- **No propagation delay** — links work immediately after creation, even across regions (see [Architecture](#architecture))

## Quick Start

### One-Click Deploy

Click the button above to deploy to Cloudflare. The deploy flow will automatically create KV, D1, and Analytics Engine resources and prompt you for secrets.

### Local Development

```bash
npm install
npm run generate-types
cp .dev.vars.example .dev.vars   # fill in your values
```

Apply D1 migrations locally and start the dev server:

```bash
npx wrangler d1 migrations apply ishere --local
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
| `POST` | `/api/slack/interact`  | No   | Slack interactive messages |
| `GET`  | `/`                   | No   | Interactive API reference |
| `GET`  | `/openapi.json`       | No   | OpenAPI spec              |

Auth is via the `Authorization: Bearer <token>` header.

## Usage Examples

**Create a short link:**

```bash
curl https://your-domain/api/link \
  --request POST \
  --header 'Authorization: Bearer yourapikey' \
  --json '{ "destinationUrl": "https://example.com" }'
```

**Create with custom namespace and path:**

```bash
curl https://your-domain/api/link \
  --request POST \
  --header 'Authorization: Bearer yourapikey' \
  --json '{ "destinationUrl": "https://example.com", "namespace": "brand", "shortPath": "campaign" }'
```

**Update a link:**

```bash
curl https://your-domain/api/link/abc12 \
  --request PATCH \
  --header 'Authorization: Bearer yourapikey' \
  --json '{ "destinationUrl": "https://new-url.com" }'
```

**Delete a link:**

```bash
curl https://your-domain/api/link/abc12 \
  --request DELETE \
  --header 'Authorization: Bearer yourapikey'
```

**Get stats:**

```bash
curl https://your-domain/api/link/abc12/stats/day \
  --header 'Authorization: Bearer yourapikey'
```

## Configuration

| Variable                   | Required | Description                                              |
| -------------------------- | -------- | -------------------------------------------------------- |
| `API_KEY`                  | Yes      | Secret key for authenticating API requests               |
| `ANALYTICS_API_TOKEN`      | Yes      | Cloudflare API token for querying Analytics Engine        |
| `ACCOUNT_ID`               | Yes      | Your Cloudflare Account ID                               |
| `DEFAULT_SHORT_PATH_LENGTH`| No       | Length of auto-generated short paths (default: `5`)      |
| `MAX_SHORT_ID_RETRIES`     | No       | Max retries on ID collision (default: `5`)               |
| `SLACK_BOT_TOKEN`          | No       | Slack Bot User OAuth Token (`xoxb-...`) for notifications |
| `SLACK_CHANNEL_ID`         | No       | Slack channel to post link notifications to               |
| `SLACK_SIGNING_SECRET`     | No       | Slack signing secret for verifying interactive messages    |

Set secrets locally in `.dev.vars` and via `wrangler secret put` for deployed environments.

## Slack App Setup

The Slack integration lets you create, look up, and manage short links via a slash command, with optional bot notifications when links are created or updated.

### 1. Create a Slack App

Go to [api.slack.com/apps](https://api.slack.com/apps) and click **Create New App** > **From scratch**. Name it (e.g. "IsHere") and select your workspace.

### 2. Slash Command

Under **Slash Commands** > **Create New Command**:

- **Command:** `/ishere`
- **Request URL:** `https://<your-worker>/api/slack/command?apiKey=<your-API_KEY>`

The API key is passed as a query parameter because Slack doesn't send custom auth headers with slash commands.

### 3. Interactivity

Under **Interactivity & Shortcuts**, toggle **Interactivity** on and set the **Request URL** to:

```
https://<your-worker>/api/slack/interact
```

This powers the interactive buttons (View Stats, View Details, etc.) that appear in bot notification messages.

### 4. Bot Token Scopes

Under **OAuth & Permissions** > **Bot Token Scopes**, add:

- `chat:write` — for posting link-change notifications to a channel

### 5. Install & Set Secrets

Install the app to your workspace, then set the following secrets (via `wrangler secret put` or `.dev.vars` locally):

| Secret                 | Where to find it                                                       |
| ---------------------- | ---------------------------------------------------------------------- |
| `SLACK_SIGNING_SECRET` | **Basic Information** > Signing Secret                                 |
| `SLACK_BOT_TOKEN`      | **OAuth & Permissions** > Bot User OAuth Token (`xoxb-...`)            |
| `SLACK_CHANNEL_ID`     | Right-click a channel in Slack > **View channel details** > Channel ID |

`SLACK_BOT_TOKEN` and `SLACK_CHANNEL_ID` are optional — if unset, bot notifications are silently skipped. `SLACK_SIGNING_SECRET` is required for the interaction endpoint.

Finally, invite the bot to your notification channel: `/invite @IsHere`

### Slash Command Usage

```
/ishere help
/ishere create <url>
/ishere create <namespace> <url>
/ishere create <namespace> <shortPath> <url>
/ishere update <id> <url>
/ishere get <id>
/ishere details <id>
/ishere stats <id>
```

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

Deploy via the [Cloudflare Deploy Button](#quick-start) or manually:

```bash
npm run deploy
```

This runs D1 migrations and deploys the worker. Set your custom domain in the Cloudflare dashboard after deploying.
