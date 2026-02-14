import { createRoute } from '@hono/zod-openapi';
import { buildRequestDoc, jsonResponseDoc, standardResponsesDoc } from '../../../openapi';
import { getLinkStatsAction } from '../../../actions';
import { LinkResponseSchema, LinkStatsParamsSchema, LinkStatsQuerySchema } from '../../../schema';
import apiKeyAuthMiddleware from '../../../middleware/auth';
import { createApp } from '../../app';

const SUCCESS_STATUS = 200;

const app = createApp();

app.openapi(
	createRoute({
		method: 'get',
		path: '/:id/stats/:groupBy',
		tags: ['API'],
		middleware: apiKeyAuthMiddleware,
		request: {
			...buildRequestDoc({
				params: LinkStatsParamsSchema,
			}),
			query: LinkStatsQuerySchema,
		},
		responses: {
			...jsonResponseDoc(
				SUCCESS_STATUS,
				LinkResponseSchema,
				'Short link stats retrieved successfully'
			),
			...standardResponsesDoc({ validations: false }),
		},
		summary: 'Get stats for short link',
		security: [{ apiKey: [] }],
		description: 'Get stats for a short link.',
	}),
	async (c) => {
		const { id, groupBy } = c.req.param();
		const { exclude_bot_traffic: excludeBotTraffic } = c.req.query();

		const { data } = await getLinkStatsAction({
			url: c.req.url,
			data: { id, groupBy, excludeBotTraffic: excludeBotTraffic === 'true' },
			env: c.env,
			ctx: c.executionCtx,
		});

		return c.json(data, SUCCESS_STATUS);
	}
);

export default app;
