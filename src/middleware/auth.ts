import { Context, Next } from 'hono';
import { errorResponse } from '../utils/error-response';

export default async function apiKeyAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
	const header = c.req.header('Authorization');
	const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

	if (!token) {
		return c.json(errorResponse('Invalid authorization. Use Authorization: Bearer <token>'), 401);
	}

	if (token !== c.env.API_KEY) {
		return c.json(errorResponse('Invalid API key. Use Authorization: Bearer <token>'), 403);
	}

	await next();
}
