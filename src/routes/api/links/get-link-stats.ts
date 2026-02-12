import { createRoute } from '@hono/zod-openapi';
import {
	buildRequestDoc,
	internalServerErrorResponseData,
	jsonResponseDoc,
	standardResponsesDoc,
} from '../../../openapi';
import { getLinkStatsAction } from '../../../actions';
import StatusError from '../../../errors/status-error';
import statusErrorToJson from '../../../utils/status-error-to-json';
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

		try {
			const { data } = await getLinkStatsAction({
				url: c.req.url,
				data: { id, groupBy, excludeBotTraffic: excludeBotTraffic === 'true' },
				env: c.env,
				ctx: c.executionCtx,
			});

			return c.json(data, SUCCESS_STATUS);
		} catch (error) {
			console.error(error);

			if (error instanceof StatusError) {
				const { status, data } = statusErrorToJson(error);
				return c.json(data, status);
			}

			return c.json(internalServerErrorResponseData(), 500);
		}
	}
);

export default app;
