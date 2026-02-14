import { createRoute } from '@hono/zod-openapi';
import { healthCheckAction } from '../../../actions';
import { jsonResponseDoc, serverErrorResponseDoc } from '../../../openapi';
import { LinkResponseSchema } from '../../../schema';
import { createApp } from '../../app';

const SUCCESS_STATUS = 200;

const app = createApp();

app.openapi(
	createRoute({
		method: 'get',
		path: '/',
		tags: ['API'],
		responses: {
			...jsonResponseDoc(SUCCESS_STATUS, LinkResponseSchema, 'Short link returned if API is up and working.'),
			...serverErrorResponseDoc(),
		},
		summary: 'API health check',
		description: 'Returns health short link if API is up and working, 5XX status otherwise.',
	}),
	async (c) => {
		const { data } = await healthCheckAction({
			url: c.req.url,
			data: {},
			env: c.env,
			ctx: c.executionCtx,
		});

		return c.json(data, SUCCESS_STATUS);
	}
);

export default app;
