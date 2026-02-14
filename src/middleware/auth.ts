import { Context, Next } from 'hono';
import { errorResponse } from '../utils/error-response';

const timingSafeEqual = async (a: string, b: string): Promise<boolean> => {
	const encoder = new TextEncoder();
	const aBuf = encoder.encode(a);
	const bBuf = encoder.encode(b);
	if (aBuf.byteLength !== bBuf.byteLength) return false;
	return crypto.subtle.timingSafeEqual(aBuf, bBuf);
};

export default async function apiKeyAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
	const header = c.req.header('Authorization');
	const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

	if (!token) {
		return c.json(errorResponse('Invalid authorization. Use Authorization: Bearer <token>'), 401);
	}

	const isValid = await timingSafeEqual(token, c.env.API_KEY);
	if (!isValid) {
		return c.json(errorResponse('Invalid API key. Use Authorization: Bearer <token>'), 403);
	}

	await next();
}
