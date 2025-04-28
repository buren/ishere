import { Context, Next } from 'hono';
import { apiKeyHeader, legacyApiKeyHeader } from '../utils/constants';

const invalidAuth = {
	success: false,
	error: {
		issues: [
			{
				validation: 'authorization',
				code: 'invalid_authorization',
				message: 'Invalid authorization. X-API-KEY: yourapitoken',
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
				code: 'invalid_api_token',
				message: 'Invalid API key. X-API-KEY: yourapitoken',
				path: [],
			},
		],
		name: 'AuthorizationError',
	},
};

export default async function apiKeyAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
	const apiKey = c.req.header(apiKeyHeader) || c.req.header(legacyApiKeyHeader);

	if (!apiKey) {
		return c.json(invalidAuth, 401);
	}

	if (apiKey !== c.env.API_TOKEN) {
		return c.json(invalidApiKey, 403);
	}

	await next();
}
