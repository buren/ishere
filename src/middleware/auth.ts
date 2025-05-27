import { Context, Next } from 'hono';
import { apiKeyHeader } from '../utils/constants';

const invalidAuth = {
	success: false,
	error: {
		issues: [
			{
				validation: 'authorization',
				code: 'invalid_authorization',
				message: `Invalid authorization. ${apiKeyHeader}: yourapikey`,
				path: [],
			},
		],
		name: 'AuthorizationError',
	},
};

const invalidApiKey = {
	success: false,
	error: {
		issues: [
			{
				validation: 'authorization',
				code: 'invalid_api_key',
				message: `Invalid API key. ${apiKeyHeader}: yourapikey`,
				path: [],
			},
		],
		name: 'AuthorizationError',
	},
};

export default async function apiKeyAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
	const apiKey = c.req.header(apiKeyHeader);

	if (!apiKey) {
		return c.json(invalidAuth, 401);
	}

	if (apiKey !== c.env.API_TOKEN) {
		return c.json(invalidApiKey, 403);
	}

	await next();
}
