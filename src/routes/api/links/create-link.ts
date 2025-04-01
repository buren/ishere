import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { buildRequestDoc, internalServerErrorResponseData, jsonResponseDoc, standardResponsesDoc } from '../../../openapi';
import { createLinkAction } from '../../../actions';
import StatusError from '../../../errors/status-error';
import statusErrorToJson from '../../../utils/status-error-to-json';
import { CreateLinkRequestSchema, LinkResponseSchema } from '../../../types';
import apiKeyAuthMiddleware from '../../../middleware/auth';

const SUCCESS_STATUS = 201;

const app = new OpenAPIHono<{ Bindings: Env }>();

app.openapi(
	createRoute({
		method: 'post',
		path: '/',
		tags: ['API'],
		middleware: apiKeyAuthMiddleware,
		request: buildRequestDoc({ schema: CreateLinkRequestSchema }),
		responses: {
			...jsonResponseDoc(SUCCESS_STATUS, LinkResponseSchema, 'Short link created successfully.'),
			...standardResponsesDoc({ validations: true }),
		},
		summary: 'Create short link',
		security: [{ apiKey: [] }],
		description: `Generates a short link for a provided destination URL.

**Namespace and Short Path Logic**

| Namespace               | Short Path       | Generated ID        | Resulting Path       |
| ------------------------| ---------------- | ------------------- | -------------------- |
| \`washere\`             | \`ee2A2\`        | \`washere-ee2A2\`   | \`/washere/ee2A2\`   |
| *omitted*               | \`my-link\`      | \`my-link\`         | \`/my/link\`  |
| \`example\`             | \`my-link\`      | \`example-my-link\` | \`/example/my-link\` |
| \`test\`                | *omitted*        | \`test-abc12\`      | \`/test/abc12\`      |
| *omitted*               | *omitted*        | \`def345\`          | \`/def345\`          |

_NOTE_: You can always use \`/{namespace}-{path}\` just as well as \`/{namespace}/{path}\`, e.g \`/example-my-link\` instead of \`/example/my-link\`.
`,
	}),
	async (c) => {
		const json = c.req.valid('json');

		try {
			const { data, waitFor } = await createLinkAction({
				url: c.req.url,
				data: json,
				env: c.env,
			});

			waitFor?.forEach((promise) => c.executionCtx.waitUntil(promise));

			return c.json(data, SUCCESS_STATUS);
		} catch (error) {
			console.log(error);

			if (error instanceof StatusError) {
				const { status, data } = statusErrorToJson(error);
				return c.json(data, status);
			}

			return c.json(internalServerErrorResponseData(), 500);
		}
	}
);

export default app;
