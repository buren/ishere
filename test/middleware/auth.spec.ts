import { env, SELF } from 'cloudflare:test';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as utils from '../../src/utils/generate-short-id';

const API_KEY = 'notsosecret';

describe('API Key Authentication Middleware', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('should reject request without API key', async () => {
		const response = await SELF.fetch('https://example.com/api/link/whatever', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
		});

		expect(response.status).toBe(401);
		const data = await response.json() as any;
		expect(data).toStrictEqual({
			error: {
				message: 'Invalid authorization. Use Authorization: Bearer <token>',
			},
		});
	});

	it('should reject request with invalid API key', async () => {
		const response = await SELF.fetch('https://example.com/api/link/whatever', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json', Authorization: 'Bearer wrong-key' },
		});

		expect(response.status).toBe(403);
		const data = await response.json() as any;
		expect(data).toStrictEqual({
			error: {
				message: 'Invalid API key. Use Authorization: Bearer <token>',
			},
		});
	});

	it('should allow request with valid API key', async () => {
		const id = utils.generateShortId();
		await env.KV.put(id, JSON.stringify({ id }));

		const requestBody = { destinationUrl: 'https://example.com', shortPath: 'validPath' };

		const response = await SELF.fetch(`https://example.com/api/link/${id}`, {
			method: 'DELETE',
			body: JSON.stringify(requestBody),
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
		});

		expect(response.status).toBe(202);
	});
});
