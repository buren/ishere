import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { apiReference } from '@scalar/hono-api-reference';
import linkRoutes from './api/links';
import slackRoutes from './api/slack';
import healthRoutes from './api/health';
import redirectRoutes from './redirects';
import { Context } from 'hono';
import { notFoundResponseData } from '../openapi';
import { homePageHtml } from '../html';
import { createApp } from './app';

const app = createApp();
app.use('*', logger());
app.use('*', cors());

// Root route
// app.use('/', async (c: Context<{ Bindings: Env }>) => {
// 	return c.render(homePageHtml("/docs"));
// });

// API routes
app.route('/api/link', linkRoutes);
app.route('/api/slack', slackRoutes);
app.route('/api/health', healthRoutes);

// API 404
app.use('/api/*', async (c: Context<{ Bindings: Env }>) => {
	return c.json(notFoundResponseData(), 404);
});

// Scalar API docs
app.get(
	'/',
	apiReference({
		url: '/openapi.json',
		title: 'IsHere API',
		hideDownloadButton: true,
		hideSearch: false,
		tagsSorter: (a, b) => {
			const customOrder: Record<string, number> = {
				Redirects: 1,
				'Link Preview': 2,
				API: 3,
				QR: 4,
				Slack: 5,
			};

			const orderA = customOrder[a.name];
			const orderB = customOrder[b.name];

			if (orderA && orderB) {
				// Both tags are in the custom order, sort by custom order
				return orderA - orderB;
			} else if (orderA) {
				// Only tag 'a' is in the custom order, place it before
				return -1;
			} else if (orderB) {
				// Only tag 'b' is in the custom order, place it after
				return 1;
			} else {
				// Neither tag is in the custom order, sort alphabetically
				return a.name.localeCompare(b.name);
			}
		},
		metaData: {
			title: 'IsHere API',
			description: 'API for creating and managing short links.',
		},
	})
);

// OpenAPI specification
app.doc('/openapi.json', {
	openapi: '3.0.0',
	tags: [
		{ name: 'Redirects', description: 'Resolve short links and redirect to their destination URLs.' },
		{ name: 'Link Preview', description: 'Public preview pages showing link metadata without redirecting.' },
		{ name: 'API', description: 'Create, read, update, delete, and list short links (requires authentication).' },
		{ name: 'QR', description: 'Generate QR codes for short links in PNG, SVG, or HTML formats.' },
		{ name: 'Slack', description: 'Slack slash command integration for managing links from Slack.' },
	],
	components: {
		securitySchemes: {
			apiKey: {
				type: 'http',
				scheme: 'bearer',
				description: 'API key passed as a Bearer token in the `Authorization` header.',
			},
		},
	},
	info: {
		title: 'IsHere API',
		version: '1.0.0',
		description: `Simple, blazing fast, yet powerful link shortening service.

## Overview

- 🚀 **Blazing Fast**: Redirects at the edge, leverages Cloudflare KV's global network (+330 cities, +125 countries).
- 🛤️ **Customizable Paths:** Define namespaces and custom paths for short links (e.g., \`/your-brand/ee2A2\`, \`/your-brand/your-campaign-link\`).
- 📸 **QR Code Generation:** Generate QR codes in SVG, PNG, or HTML formats by appending \`/qr\` to the redirect path.
- 🔒 **Password Protection:** Optionally require a password before redirecting.
- 📅 **Link Scheduling:** Set a go-live date so the link only activates at a specific time.
- 💬 **Slack Integration:** Create short links directly via Slack commands and global shortcuts.
- 🔗 **Webhooks:** Receive POST notifications on link create/update/delete with optional HMAC signing — integrate with Zapier, Make, or any HTTP endpoint.
- ⏳ **Time-to-Live (TTL):** Set expiration times for short links.

## Example

\`\`\`bash
curl https://example.com/api/link      \\
  --request POST                   \\
  --header 'Authorization: Bearer yourapikey' \\
  --json '{ "destinationUrl": "https://example.com" }'
\`\`\`
`,
	},
});

// Redirect routes
app.route('/', redirectRoutes);

export default app;
