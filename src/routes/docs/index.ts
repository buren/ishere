import { apiReference } from "@scalar/hono-api-reference";
import { apiKeyHeader } from "../../utils/constants";
import { createApp } from "../app";

const app = createApp();

// Scalar API docs
app.get(
	'/docs',
	apiReference({
		url: '/openapi.json',
		title: 'IsHere API',
		hideDownloadButton: true,
		hideSearch: false,
		tagsSorter: (a, b) => {
			const customOrder: Record<string, number> = {
				Redirects: 1,
				API: 2,
				QR: 3,
				Slack: 4,
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
	info: {
		title: 'IsHere API',
		version: '1.0.0',
		description: `Simple, blazing fast, yet powerful link shortening service.

## Overview

- 🚀 **Blazing Fast**: Redirects at the edge, leverages Cloudflare KV's global network (+330 cities, +125 countries).
- 🛤️ **Customizable Paths:** Define namespaces and custom paths for short links (e.g., \`/your-brand/ee2A2\`, \`/your-brand/your-campaign-link\`).
- 📸 **QR Code Generation:** Generate QR codes in SVG, PNG, or HTML formats by appending \`/qr\` to the redirect path.
- 💬 **Slack Integration:** Create short links directly via Slack commands.
- ⏳ **Time-to-Live (TTL):** Set expiration times for short links.

## Example

\`\`\`bash
curl https://wshr.io/api/link      \\
  --request POST                   \\
  --header '${apiKeyHeader}: yourapikey' \\
  --json '{ "destinationUrl": "https://example.com" }'
\`\`\`
`,
	},
});

export default app;
