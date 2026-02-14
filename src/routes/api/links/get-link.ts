import { createRoute } from '@hono/zod-openapi';
import { buildRequestDoc, jsonResponseDoc, standardResponsesDoc } from '../../../openapi';
import { getLinkAction } from '../../../actions';
import { LinkParamsSchema, LinkResponseSchema } from '../../../schema';
import { createApp } from '../../app';

const SUCCESS_STATUS = 200;

const app = createApp();

app.openapi(
	createRoute({
		method: 'get',
		path: '/:id',
		tags: ['API'],
		request: buildRequestDoc({ params: LinkParamsSchema }),
		responses: {
			...jsonResponseDoc(SUCCESS_STATUS, LinkResponseSchema, 'Short link retrieved successfully'),
			...standardResponsesDoc({ auth: false, validations: false }),
		},
		summary: 'Get short link',
		description: 'Get a short link.',
	}),
	async (c) => {
		const { id } = c.req.param();

		const { data } = await getLinkAction({
			url: c.req.url,
			data: { id },
			env: c.env,
			ctx: c.executionCtx,
		});

		return c.json(data, SUCCESS_STATUS);
	}
);

export default app;
