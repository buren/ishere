import { createRoute } from '@hono/zod-openapi';
import { buildRequestDoc, jsonResponseDoc, standardResponsesDoc } from '../../../openapi';
import { deleteLinkAction } from '../../../actions';
import { LinkDeleteResponseSchema, LinkParamsSchema } from '../../../schema';
import apiKeyAuthMiddleware from '../../../middleware/auth';
import { createApp } from '../../app';

const SUCCESS_STATUS = 202;

const app = createApp();

app.openapi(
	createRoute({
		method: 'delete',
		path: '/:id',
		tags: ['API'],
		middleware: apiKeyAuthMiddleware,
		request: buildRequestDoc({ params: LinkParamsSchema }),
		responses: {
			...jsonResponseDoc(
				SUCCESS_STATUS,
				LinkDeleteResponseSchema,
				'Short link deleted successfully'
			),
			...standardResponsesDoc(),
		},
		summary: 'Delete short link',
		security: [{ apiKey: [] }],
		description: `Deletes a short link.

⚠️ Can take up to 60 seconds to propagate.`,
	}),
	async (c) => {
		const { id } = c.req.param();

		const { data } = await deleteLinkAction({
			url: c.req.url,
			data: { id },
			env: c.env,
			ctx: c.executionCtx,
		});

		return c.json(data, SUCCESS_STATUS);
	}
);

export default app;
