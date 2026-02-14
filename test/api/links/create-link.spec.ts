import { createExecutionContext, env, SELF, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as utils from '../../../src/utils/generate-short-id';
import { reservedPaths } from '../../../src/utils/constants';
import { messages } from '../../../src/actions';
import { dbCreateLink, dbGetLink } from '../../../src/db';
import { LinkResponseSchema } from '../../../src/schema';
import { z } from 'zod';

type ResponseBody = z.infer<typeof LinkResponseSchema>;

describe('POST /api/link', () => {
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

	it('should create link with provided shortPath and no namespace', async () => {
		const requestBody = { destinationUrl: 'https://example.com', shortPath: 'customPath' };

		const response = await SELF.fetch('https://example.com/api/link', {
			method: 'POST',
			body: JSON.stringify(requestBody),
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
		});

		const data = await response.json() as ResponseBody;

		expect(data).toStrictEqual({
			id: 'customPath',
			destinationUrl: requestBody.destinationUrl,
			namespace: null,
			expirationTtl: null,
			createdAt: testDateISO,
			updatedAt: testDateISO,
			expiresAt: null,
			redirectStatusCode: 302,
			passwordProtected: false,
			url: 'https://example.com/customPath',
			qrUrl: 'https://example.com/customPath/qr',
		});

		expect(response.status).toBe(201);
	});

	it('should create link with namespace and provided shortPath', async () => {
		const requestBody = { destinationUrl: 'https://example.com', shortPath: 'link123', namespace: 'brand' };

		const response = await SELF.fetch('https://example.com/api/link', {
			method: 'POST',
			body: JSON.stringify(requestBody),
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
		});

		const data = await response.json() as ResponseBody;
		expect(data.id).toBe('brand-link123');
		expect(response.status).toBe(201);
	});

	it('should create link and persist to D1 database', async () => {
		const destinationUrl = 'https://example.com';
		const requestBody = { destinationUrl };

		const response = await SELF.fetch('https://example.com/api/link', {
			method: 'POST',
			body: JSON.stringify(requestBody),
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
		});

		await waitOnExecutionContext(ctx);
		const { id } = await response.json() as ResponseBody;

		const link = await dbGetLink(env.D1, { id: id });
		expect(link?.id).toBe(id);
		expect(link?.destinationUrl).toBe(destinationUrl);
		expect(response.status).toBe(201);
	});

	it('should generate a shortPath if none provided', async () => {
		vi.spyOn(utils, 'generateShortId').mockReturnValue('generatedPath');

		const requestBody = { destinationUrl: 'https://example.com', length: 8 };

		const response = await SELF.fetch('https://example.com/api/link', {
			method: 'POST',
			body: JSON.stringify(requestBody),
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
		});

		const data = await response.json() as ResponseBody;
		expect(data.id).toBe('generatedPath');
		expect(response.status).toBe(201);
	});

	it('should retry if generated shortPath collides', async () => {
		// Pre-populate D1 with a collision entry
		await dbCreateLink(env.D1, {
			id: 'collision',
			destinationUrl: 'https://existing.com',
			namespace: null,
			expirationTtl: null,
			createdAt: testDateISO,
			updatedAt: testDateISO,
			expiresAt: null,
			redirectStatusCode: 302,
		});

		vi.spyOn(utils, 'generateShortId')
			.mockReturnValueOnce('collision')
			.mockReturnValueOnce('uniquePath');

		const requestBody = { destinationUrl: 'https://example.com', length: 8 };

		const response = await SELF.fetch('https://example.com/api/link', {
			method: 'POST',
			body: JSON.stringify(requestBody),
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
		});

		const data = await response.json() as ResponseBody;
		expect(data.id).toBe('uniquePath');
		expect(response.status).toBe(201);
	});

	it('should return error for reserved shortPath', async () => {
		const requestBody = { destinationUrl: 'https://example.com', shortPath: reservedPaths[0] };

		const response = await SELF.fetch('https://example.com/api/link', {
			method: 'POST',
			body: JSON.stringify(requestBody),
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
		});

		const data = (await response.json()) as any;
		expect(data).toStrictEqual({
			error: {
				message: messages.idIsReserved,
				errors: [
					{
						field: 'id',
						code: 'reserved',
						message: messages.idIsReserved,
					},
				],
			},
		});
		expect(response.status).toBe(400);
	});

	it('should handle expirationTtl correctly', async () => {
		const expirationTtl = 1800;
		const requestBody = { destinationUrl: 'https://example.com', shortPath: 'expirePath', expirationTtl };

		const response = await SELF.fetch('https://example.com/api/link', {
			method: 'POST',
			body: JSON.stringify(requestBody),
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
		});
		const data = await response.json() as ResponseBody;
		const expectedExpiresAt = new Date(
			Date.parse(testDateISO) + expirationTtl * 1000
		).toISOString();

		expect(data.expirationTtl).toBe(expirationTtl);
		expect(data.expiresAt).toBe(expectedExpiresAt);
		expect(response.status).toBe(201);
	});

	it('should create link with redirectStatusCode 301', async () => {
		const requestBody = { destinationUrl: 'https://example.com', shortPath: 'permanent', redirectStatusCode: 301 };

		const response = await SELF.fetch('https://example.com/api/link', {
			method: 'POST',
			body: JSON.stringify(requestBody),
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
		});

		const data = await response.json() as ResponseBody;
		expect(data.redirectStatusCode).toBe(301);
		expect(response.status).toBe(201);
	});

	it('should default redirectStatusCode to 302', async () => {
		const requestBody = { destinationUrl: 'https://example.com', shortPath: 'tempRedirect' };

		const response = await SELF.fetch('https://example.com/api/link', {
			method: 'POST',
			body: JSON.stringify(requestBody),
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
		});

		const data = await response.json() as ResponseBody;
		expect(data.redirectStatusCode).toBe(302);
		expect(response.status).toBe(201);
	});

	it('should create link with password and return passwordProtected: true', async () => {
		const requestBody = { destinationUrl: 'https://example.com', shortPath: 'pwLink', password: 'mysecret' };

		const response = await SELF.fetch('https://example.com/api/link', {
			method: 'POST',
			body: JSON.stringify(requestBody),
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
		});

		const data = await response.json() as ResponseBody;
		expect(response.status).toBe(201);
		expect(data.passwordProtected).toBe(true);
		expect((data as any).password).toBeUndefined();
	});

	it('should return error for invalid api key', async () => {
		const expirationTtl = 1800;
		const requestBody = { destinationUrl: 'https://example.com', shortPath: 'expirePath', expirationTtl };

		const response = await SELF.fetch('https://example.com/api/link', {
			method: 'POST',
			body: JSON.stringify(requestBody),
			headers: { 'Content-Type': 'application/json', Authorization: 'Bearer invalidapikey' },
		});

		const data = (await response.json()) as any;
		expect(data).toStrictEqual({
			error: {
				message: 'Invalid API key. Use Authorization: Bearer <token>',
			},
		});
		expect(response.status).toBe(403);
	});
});
