import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { Context } from 'hono';
import { healthCheckAction } from '../../../actions';
import {
	buildRequestDoc,
	jsonResponseDoc,
	serverErrorResponseDoc,
	serviceUnavailableErrorResponseData,
} from '../../../openapi';
import { LinkResponseSchema } from '../../../schema';

const SUCCESS_STATUS = 200;

const app = new OpenAPIHono<{ Bindings: Env }>();

app.openapi(
	createRoute({
		method: 'get',
		path: '/',
		tags: ['API'],
		request: buildRequestDoc({ schema: z.object({}), auth: false }),
		responses: {
			...jsonResponseDoc(SUCCESS_STATUS, LinkResponseSchema, 'Short link returned if API is up and working.'),
			...serverErrorResponseDoc(),
		},
		summary: 'API health check',
		description: 'Returns health short link if API is up and working, 5XX status otherwise.',
	}),
	async (c: Context<{ Bindings: Env }>) => {
		try {
			const { data } = await healthCheckAction({
				url: c.req.url,
				data: {},
				env: c.env,
				ctx: c.executionCtx,
			});

			return c.json(data, SUCCESS_STATUS);
		} catch (error) {
			console.log(error);

			// NOTE we get a type error if we don't cast to any type here
			return c.json(serviceUnavailableErrorResponseData(), 503) as any;
		}
	}
);

export default app;
