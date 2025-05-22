import { createExecutionContext, env, SELF, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as utils from '../../../src/utils/generate-short-id';
import { reservedPaths } from '../../../src/utils/constants';
import { messages } from '../../../src/actions';
import { dbGetLink } from '../../../src/db';
import { LinkResponseSchema, ValidationErrorSchema } from '../../../src/schema';
import { z } from 'zod';

type ResponseBody = z.infer<typeof LinkResponseSchema>;
type ValidationError = z.infer<typeof ValidationErrorSchema>;

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
			headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
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
			headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
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
			headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
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
			headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
		});

		const data = await response.json() as ResponseBody;
		expect(data.id).toBe('generatedPath');
		expect(response.status).toBe(201);
	});

	it('should retry if generated shortPath collides', async () => {
		await env.KV.put('collision', JSON.stringify({ id: 'collision' }));

		vi.spyOn(utils, 'generateShortId')
			.mockReturnValueOnce('collision')
			.mockReturnValueOnce('uniquePath');

		const requestBody = { destinationUrl: 'https://example.com', length: 8 };

		const response = await SELF.fetch('https://example.com/api/link', {
			method: 'POST',
			body: JSON.stringify(requestBody),
			headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
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
			headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
		});

		const data = (await response.json()) as ValidationError;
		expect(data.error.issues[0]).toStrictEqual({
			code: '400',
			message: messages.idIsReserved,
			path: ['id'],
			validation: 'validation',
		});
		expect(response.status).toBe(400);
	});

	it('should handle expirationTtl correctly', async () => {
		const expirationTtl = 1800;
		const requestBody = { destinationUrl: 'https://example.com', shortPath: 'expirePath', expirationTtl };

		const response = await SELF.fetch('https://example.com/api/link', {
			method: 'POST',
			body: JSON.stringify(requestBody),
			headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
		});
		const data = await response.json() as ResponseBody;

		const expectedExpiresAt = new Date(
			Date.parse(testDateISO) + expirationTtl * 1000
		).toISOString();

		expect(data.expirationTtl).toBe(expirationTtl);
		expect(data.expiresAt).toBe(expectedExpiresAt);
		expect(response.status).toBe(201);
	});

	it('should return error for invalid api key', async () => {
		const expirationTtl = 1800;
		const requestBody = { destinationUrl: 'https://example.com', shortPath: 'expirePath', expirationTtl };

		const response = await SELF.fetch('https://example.com/api/link', {
			method: 'POST',
			body: JSON.stringify(requestBody),
			headers: { 'Content-Type': 'application/json', 'X-API-KEY': 'invalidapikey' },
		});

		const data = (await response.json()) as ResponseBody;
		expect(data).toStrictEqual({
			error: {
				issues: [
					{
						code: 'invalid_api_key',
						message: 'Invalid API key. X-API-KEY: yourapikey',
						path: [],
						validation: 'authorization',
					},
				],
				name: 'AuthorizationError',
			},
			success: false,
		});
		expect(response.status).toBe(403);
	});
});
