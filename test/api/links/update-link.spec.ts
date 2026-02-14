import { createExecutionContext, env, SELF, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { kvCreateLink } from '../../../src/kv/kv-create-link';
import { LinkResponseSchema } from '../../../src/schema';
import { linkWithUrl } from '../../../src/utils/link-with-url';
import { z } from 'zod';
import { dbCreateLink, dbGetLink } from '../../../src/db';

type ResponseBody = z.infer<typeof LinkResponseSchema>;

describe('PATCH /api/link/:id', () => {
	const testDate = new Date('2024-07-26T10:00:00.000Z');
	const testDateISO = testDate.toISOString();
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
		await dbCreateLink(env.D1, link);

		// Set new system time so that updatedAt get another value than createdAt
		const updatedAt = new Date('2025-05-04T23:00:00.000Z');
		vi.setSystemTime(updatedAt);

		const requestBody = { destinationUrl: "https://example.com/new-path" };
		const url = `https://example.com/api/link/${linkId}`;
		const response = await SELF.fetch(url, {
			method: 'PATCH',
			body: JSON.stringify(requestBody),
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
		});
		const data = (await response.json()) as ResponseBody;

		const expected = linkWithUrl(url, {
			...link,
			destinationUrl: 'https://example.com/new-path',
			updatedAt: updatedAt.toISOString(),
		});
		expect(response.status).toBe(202);
		expect(data).toStrictEqual(expected);

		// Verify D1 is updated
		const dbLink = await dbGetLink(env.D1, { id: linkId });
		expect(dbLink?.destinationUrl).toBe('https://example.com/new-path');
		expect(dbLink?.updatedAt).toBe(updatedAt.toISOString());
	});

	it('should update a link with new expirationTtl', async () => {
		const linkId = 'my-id';
		const link = await kvCreateLink(env.KV, { id: linkId, destinationUrl: 'https://example.com' });
		await dbCreateLink(env.D1, link);

		// Set new system time so that updatedAt get another value than createdAt
		const updatedAt = new Date('2025-05-04T23:00:00.000Z');
		vi.setSystemTime(updatedAt);

		const expirationTtl = 1800;
		const requestBody = { expirationTtl };
		const url = `https://example.com/api/link/${linkId}`;
		const response = await SELF.fetch(url, {
			method: 'PATCH',
			body: JSON.stringify(requestBody),
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
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

		// Verify D1 is updated
		const dbLink = await dbGetLink(env.D1, { id: linkId });
		expect(dbLink?.expirationTtl).toBe(expirationTtl);
	});

	it('should update redirectStatusCode from 302 to 301', async () => {
		const linkId = 'redirect-update';
		const link = await kvCreateLink(env.KV, { id: linkId, destinationUrl: 'https://example.com' });
		await dbCreateLink(env.D1, link);

		const updatedAt = new Date('2025-05-04T23:00:00.000Z');
		vi.setSystemTime(updatedAt);

		const requestBody = { redirectStatusCode: 301 };
		const url = `https://example.com/api/link/${linkId}`;
		const response = await SELF.fetch(url, {
			method: 'PATCH',
			body: JSON.stringify(requestBody),
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
		});
		const data = (await response.json()) as ResponseBody;

		expect(response.status).toBe(202);
		expect(data.redirectStatusCode).toBe(301);

		// Verify D1 is updated
		const dbLink = await dbGetLink(env.D1, { id: linkId });
		expect(dbLink?.redirectStatusCode).toBe(301);
	});

	it('should should return 400 on invalid request body', async () => {
		const requestBody = { destinationUrl: '' };
		const response = await SELF.fetch('https://example.com/api/link/nonexistent-link', {
			method: 'PATCH',
			body: JSON.stringify(requestBody),
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
		});

		expect(response.status).toBe(400);
		const data = (await response.json()) as any;
		expect(data).toStrictEqual({
			error: {
				message: 'Invalid url',
				errors: [
					{
						field: 'destinationUrl',
						code: 'invalid_format',
						message: 'Invalid url',
						params: { expected: 'url' },
					},
				],
			},
		});
	});

	it('should return 404 if link does not exist in KV or D1', async () => {
		const requestBody = { destinationUrl: 'https://example.com', shortPath: 'customPath' };
		const response = await SELF.fetch('https://example.com/api/link/nonexistent-link', {
			method: 'PATCH',
			body: JSON.stringify(requestBody),
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
		});

		expect(response.status).toBe(404);
		const data = (await response.json()) as any;
		expect(data).toStrictEqual({
			error: {
				message: 'Not found',
			},
		});
	});
});
