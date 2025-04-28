import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { Context } from 'hono';
import { healthCheckAction } from '../../../actions';
import StatusError from '../../../errors/status-error';
import statusErrorToJson from '../../../utils/status-error-to-json';
import { buildRequestDoc, internalServerErrorResponseData, jsonResponseDoc, serverErrorResponseDoc } from '../../../openapi';
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
			const { data, waitFor } = await healthCheckAction({
				url: c.req.url,
				data: {},
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

			// NOTE we get a type error if we don't cast to any type here
			return c.json(internalServerErrorResponseData(), 500) as any;
		}
	}
);

export default app;
