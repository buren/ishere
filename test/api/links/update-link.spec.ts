import { createExecutionContext, env, SELF, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { kvCreateLink } from '../../../src/kv/kv-create-link';
import { LinkResponseSchema } from '../../../src/schema';
import { linkWithUrl } from '../../../src/utils/link-with-url';
import { z } from 'zod';

type ResponseBody = z.infer<typeof LinkResponseSchema>;

describe('PATCH /api/link/:id', () => {
	const testDate = new Date('2024-07-26T10:00:00.000Z');
	const apiKey = 'notsosecret';
	let ctx: ExecutionContext;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(testDate);
		ctx = createExecutionContext();
		vi.resetAllMocks();
	});

	it('should update a link with new destinationUrl', async () => {
		const linkId = 'my-id';
		const link = await kvCreateLink(env.KV, { id: linkId, destinationUrl: 'https://example.com' });

		// Set new system time so that updatedAt get another value than createdAt
		const updatedAt = new Date('2025-05-04T23:00:00.000Z');
		vi.setSystemTime(updatedAt);

		const requestBody = { destinationUrl: "https://example.com/new-path" };
		const url = `https://example.com/api/link/${linkId}`;
		const response = await SELF.fetch(url, {
			method: 'PATCH',
			body: JSON.stringify(requestBody),
			headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
		});
		const data = (await response.json()) as ResponseBody;

		const expected = linkWithUrl(url, {
			...link,
			destinationUrl: 'https://example.com/new-path',
			updatedAt: updatedAt.toISOString(),
		});
		expect(response.status).toBe(202);
		expect(data).toStrictEqual(expected);
	});

	it('should update a link with new expirationTtl', async () => {
		const linkId = 'my-id';
		const link = await kvCreateLink(env.KV, { id: linkId, destinationUrl: 'https://example.com' });

		// Set new system time so that updatedAt get another value than createdAt
		const updatedAt = new Date('2025-05-04T23:00:00.000Z');
		vi.setSystemTime(updatedAt);

		const expirationTtl = 1800;
		const requestBody = { expirationTtl };
		const url = `https://example.com/api/link/${linkId}`;
		const response = await SELF.fetch(url, {
			method: 'PATCH',
			body: JSON.stringify(requestBody),
			headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
		});
		const data = (await response.json()) as ResponseBody;

		const expected = linkWithUrl(url, {
			...link,
			expirationTtl,
			updatedAt: updatedAt.toISOString(),
			expiresAt: new Date(updatedAt.getTime() + expirationTtl * 1000).toISOString(),
		});
		expect(response.status).toBe(202);
		expect(data).toStrictEqual(expected);
	});

	it('should should return 400 on invalid request body', async () => {
		const requestBody = { destinationUrl: '' };
		const response = await SELF.fetch('https://example.com/api/link/nonexistent-link', {
			method: 'PATCH',
			body: JSON.stringify(requestBody),
			headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
		});

		expect(response.status).toBe(400);
		const data = (await response.json()) as any;
		expect(data).toStrictEqual({
			error: {
				issues: [
					{
						code: 'invalid_string',
						message: 'Invalid url',
						path: ['destinationUrl'],
						validation: 'url',
					},
				],
				name: 'ZodError',
			},
			success: false,
		});
	});

	it('should return 404 if link does not exist in KV or D1', async () => {
		const requestBody = { destinationUrl: 'https://example.com', shortPath: 'customPath' };
		const response = await SELF.fetch('https://example.com/api/link/nonexistent-link', {
			method: 'PATCH',
			body: JSON.stringify(requestBody),
			headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
		});

		expect(response.status).toBe(404);
		const data = (await response.json()) as any;
		expect(data).toStrictEqual({
			error: {
				issues: [
					{
						code: 'not_found',
						message: 'Page not found.',
					},
				],
				name: 'NotFoundError',
			},
			success: false,
		});
	});
});
