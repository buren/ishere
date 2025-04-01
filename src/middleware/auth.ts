import { Next } from 'hono';
import { AppContext } from '../types';
import { legacyApiKeyHeader } from '../utils/constants';

const invalidAuth = {
	success: false,
	error: {
		issues: [
			{
				validation: 'authorization',
				code: 'invalid_authorization',
				message: 'Invalid authorization. Authorization: api-key {your-api-key}',
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
				message: 'Invalid API key. Authorization: api-key {your-api-key}',
				path: [],
			},
		],
		name: 'AuthorizationError',
	},
};

export default async function apiKeyAuthMiddleware(c: AppContext, next: Next) {
	const legacyHeaderApiKey = c.req.header(legacyApiKeyHeader);
	if (legacyApiKeyHeader && legacyHeaderApiKey !== c.env.API_TOKEN) {
		return c.json(invalidApiKey, 403);
	}

	const authHeader = c.req.header('Authorization');
	const [scheme, apiKey] = (authHeader || '').split(' ');

	if (!authHeader || scheme !== 'api-key' || !apiKey) {
		return c.json(invalidAuth, 401);
	}

	if (apiKey !== c.env.API_TOKEN) {
		return c.json(invalidApiKey, 403);
	}

	await next();
}
