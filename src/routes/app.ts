import { OpenAPIHono } from '@hono/zod-openapi';
import { zodToErrorResponse } from '../utils/error-response';
import StatusError from '../errors/status-error';
import statusErrorToJson from '../utils/status-error-to-json';
import { internalServerErrorResponseData } from '../openapi';

export const createApp = () => {
	const app = new OpenAPIHono<{ Bindings: Env }>({
		defaultHook: (result, c) => {
			if (!result.success) {
				return c.json(zodToErrorResponse(result.error), 400);
			}
		},
	});

	app.onError((error, c) => {
		console.error(error);
		if (error instanceof StatusError) {
			const { status, data } = statusErrorToJson(error);
			return c.json(data, status);
		}
		return c.json(internalServerErrorResponseData(), 500);
	});

	return app;
};
