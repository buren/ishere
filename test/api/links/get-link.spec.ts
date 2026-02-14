import { createExecutionContext, env, SELF, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as utils from '../../../src/utils/generate-short-id';
import { dbCreateLink } from '../../../src/db';
import { linkWithUrl } from '../../../src/utils/link-with-url';
import { kvCreateLink } from '../../../src/kv/kv-create-link';

describe('GET /api/link/:id', () => {
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

	  it('should retrieve a link successfully from KV', async () => {
			const id = utils.generateShortId();
			const linkData = { destinationUrl: 'https://example.com', id };

			await kvCreateLink(env.KV, { destinationUrl: 'https://example.com', id })

			const url = `https://example.com/api/link/${id}`;
			const response = await SELF.fetch(url, {
				method: 'GET',
			});

			expect(response.status).toBe(200);
			const data = await response.json() as any;
			const expected = linkWithUrl(url, {
				...linkData,
				namespace: null,
				expirationTtl: null,
				createdAt: testDateISO,
				updatedAt: testDateISO,
				expiresAt: null,
				redirectStatusCode: 302,
			});
			expect(data).toStrictEqual(expected);
		});

		it('should retrieve a link successfully from D1 fallback', async () => {
			const id = utils.generateShortId();
			const linkData = {
				destinationUrl: 'https://example.com',
				id,
				expirationTtl: null,
				createdAt: testDateISO,
				updatedAt: testDateISO,
				expiresAt: null,
				redirectStatusCode: 302,
			};
			await dbCreateLink(env.D1, linkData);

			const url = `https://example.com/api/link/${id}`;
			const response = await SELF.fetch(url, {
				method: 'GET',
			});

			expect(response.status).toBe(200);
			const data = await response.json() as any;
			const expected = linkWithUrl(url, {
				...linkData,
				namespace: null,
				expiresAt: null,
				createdAt: testDateISO,
				updatedAt: testDateISO,
				redirectStatusCode: 302,
			});
			expect(data).toStrictEqual(expected);
		});

		it('should return 404 if link does not exist in KV or D1', async () => {
			const response = await SELF.fetch('https://example.com/api/link/nonexistent-link', {
				method: 'GET',
			});

			expect(response.status).toBe(404);
			const data = await response.json() as any;
			expect(data).toStrictEqual({
				error: {
					message: 'Not found',
				},
			});
	});
});
