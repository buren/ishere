import { OpenAPIHono } from '@hono/zod-openapi';
import { zodToErrorResponse } from '../utils/error-response';

export const createApp = () =>
	new OpenAPIHono<{ Bindings: Env }>({
		defaultHook: (result, c) => {
			if (!result.success) {
				return c.json(zodToErrorResponse(result.error), 400);
			}
		},
	});
