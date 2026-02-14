import { createRoute, z } from '@hono/zod-openapi';
import { buildRequestDoc, jsonResponseDoc, standardResponsesDoc } from '../../../openapi';
import { createLinkAction } from '../../../actions';
import { CreateLinkRequestSchema, LinkResponseSchema } from '../../../schema';
import apiKeyAuthMiddleware from '../../../middleware/auth';
import { createApp } from '../../app';

const SUCCESS_STATUS = 201;

const app = createApp();

app.openapi(
	createRoute({
		method: 'post',
		path: '/',
		tags: ['API'],
		middleware: apiKeyAuthMiddleware,
		request: buildRequestDoc({ schema: CreateLinkRequestSchema }),
		responses: {
			...jsonResponseDoc(SUCCESS_STATUS, LinkResponseSchema, 'Short link created successfully'),
			...standardResponsesDoc({ validations: true }),
		},
		summary: 'Create short link',
		security: [{ apiKey: [] }],
		description: `Generates a short link for a provided destination URL.

**Namespace and Short Path Logic**

| Namespace          | Short Path      | Generated ID          | Resulting Path         |
| ------------------ | --------------- | --------------------- | ---------------------- |
| \`your-brand\`     | \`ee2A2\`       | \`your-brand-ee2A2\`  | \`/your-brand/ee2A2\`  |
| *omitted*          | \`your-link\`   | \`your-link\`         | \`/your/link\`  		 	  |
| \`example\`        | \`your-link\`   | \`example-your-link\` | \`/example/your-link\` |
| \`test\`           | *omitted*       | \`test-abc12\`        | \`/test/abc12\`        |
| *omitted*          | *omitted*       | \`def345\`            | \`/def345\`            |

_NOTE_: You can use \`/{namespace}-{path}\` just as well as \`/{namespace}/{path}\`, e.g \`/example-your-link\` instead of \`/example/your-link\`.
`,
	}),
	async (c) => {
		const json = c.req.valid('json');

		const { data } = await createLinkAction({
			url: c.req.url,
			data: json,
			env: c.env,
			ctx: c.executionCtx,
		});

		return c.json(data, SUCCESS_STATUS);
	}
);

export default app;
