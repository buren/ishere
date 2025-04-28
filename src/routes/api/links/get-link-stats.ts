import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import {
	buildRequestDoc,
	internalServerErrorResponseData,
	jsonResponseDoc,
	notFoundResponseData,
	standardResponsesDoc,
} from '../../../openapi';
import { getLinkStatsAction, isValidTimeGroup } from '../../../actions';
import StatusError from '../../../errors/status-error';
import statusErrorToJson from '../../../utils/status-error-to-json';
import { GetLinkStatsRequestSchema, LinkResponseSchema, LinkStatsParamsSchema } from '../../../schema';
import apiKeyAuthMiddleware from '../../../middleware/auth';

const SUCCESS_STATUS = 200;

const app = new OpenAPIHono<{ Bindings: Env }>();

app.openapi(
	createRoute({
		method: 'get',
		path: '/:id/stats/:groupBy',
		tags: ['API'],
		middleware: apiKeyAuthMiddleware,
		request: buildRequestDoc({ schema: GetLinkStatsRequestSchema, params: LinkStatsParamsSchema }),
		responses: {
			...jsonResponseDoc(SUCCESS_STATUS, LinkResponseSchema, 'Short link stats retrieved successfully.'),
			...standardResponsesDoc({ validations: false }),
		},
		summary: 'Get stats for short link',
		security: [{ apiKey: [] }],
		description: 'Get stats for a short link.',
	}),
	async (c) => {
		const { id, groupBy } = c.req.param();

		// TODO can we use zod for validating the groupBy param to be one of hour/day?
		if (!isValidTimeGroup(groupBy)) {
			return c.json(
				notFoundResponseData([
					{
						code: 'invalid_time_group',
						message: 'Invalid groupBy, must be one of: day, hour',
					},
				]),
				404
			);
		}

		try {
			const { data } = await getLinkStatsAction({
				url: c.req.url,
				data: { id, groupBy },
				env: c.env,
			});

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
