import { Context, Next } from 'hono';
import { apiKeyHeader } from '../utils/constants';
import { errorResponse } from '../utils/error-response';

export default async function apiKeyAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
	const apiKey = c.req.header(apiKeyHeader);

	if (!apiKey) {
		return c.json(errorResponse(`Invalid authorization. Use ${apiKeyHeader}: yourapikey`), 401);
	}

	if (apiKey !== c.env.API_KEY) {
		return c.json(errorResponse(`Invalid API key. Use ${apiKeyHeader}: yourapikey`), 403);
	}

	await next();
}
