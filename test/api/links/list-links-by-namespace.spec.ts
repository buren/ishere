import { createExecutionContext, env, SELF } from 'cloudflare:test';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dbCreateLink } from '../../../src/db';
import { linkWithUrl } from '../../../src/utils/link-with-url';
import * as actions from '../../../src/actions';

describe('GET /api/link/namespace/:namespace', () => {
	const testDate = new Date('2024-07-26T10:00:00.000Z');
	const testDateISO = testDate.toISOString();
	let ctx: ExecutionContext;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(testDate);
		ctx = createExecutionContext();
		vi.resetAllMocks();
	});

	const makeLink = (namespace: string, shortPath: string, dest: string) => ({
		destinationUrl: dest,
		id: `${namespace}-${shortPath}`,
		namespace,
		expirationTtl: null,
		createdAt: testDateISO,
		updatedAt: testDateISO,
		expiresAt: null,
		redirectStatusCode: 302,
		scheduledAt: null,
	});

	it('should return links for a namespace with multiple links', async () => {
		const namespace = 'test-ns';
		const link1 = makeLink(namespace, 'abc', 'https://example.com/one');
		const link2 = makeLink(namespace, 'def', 'https://example.com/two');

		await dbCreateLink(env.D1, link1);
		await dbCreateLink(env.D1, link2);

		const url = `https://example.com/api/link/namespace/${namespace}`;
		const response = await SELF.fetch(url, { method: 'GET' });

		expect(response.status).toBe(200);
		const body = await response.json() as any;
		expect(body.data).toHaveLength(2);
		expect(body.total).toBe(2);
		expect(body.limit).toBe(50);
		expect(body.offset).toBe(0);

		const expected1 = linkWithUrl(url, link1);
		const expected2 = linkWithUrl(url, link2);
		expect(body.data).toStrictEqual([expected1, expected2]);
	});

	it('should return empty array for namespace with no links', async () => {
		const url = 'https://example.com/api/link/namespace/nonexistent-ns';
		const response = await SELF.fetch(url, { method: 'GET' });

		expect(response.status).toBe(200);
		const body = await response.json() as any;
		expect(body.data).toStrictEqual([]);
		expect(body.total).toBe(0);
	});

	it('should include correct url and qrUrl fields', async () => {
		const namespace = 'brand';
		const link = makeLink(namespace, 'xyz', 'https://example.com/page');

		await dbCreateLink(env.D1, link);

		const url = `https://example.com/api/link/namespace/${namespace}`;
		const response = await SELF.fetch(url, { method: 'GET' });

		expect(response.status).toBe(200);
		const body = await response.json() as any;
		expect(body.data).toHaveLength(1);
		expect(body.data[0].url).toBe('https://example.com/brand/xyz');
		expect(body.data[0].qrUrl).toBe('https://example.com/brand/xyz/qr');
	});

	it('should respect limit and offset query params', async () => {
		const namespace = 'paged';
		for (let i = 0; i < 5; i++) {
			await dbCreateLink(env.D1, makeLink(namespace, `p${i}`, `https://example.com/${i}`));
		}

		const url = `https://example.com/api/link/namespace/${namespace}?limit=2&offset=1`;
		const response = await SELF.fetch(url, { method: 'GET' });

		expect(response.status).toBe(200);
		const body = await response.json() as any;
		expect(body.data).toHaveLength(2);
		expect(body.total).toBe(5);
		expect(body.limit).toBe(2);
		expect(body.offset).toBe(1);
	});

	it('should clamp limit to max 100', async () => {
		const namespace = 'clamped';
		await dbCreateLink(env.D1, makeLink(namespace, 'one', 'https://example.com/one'));

		const url = `https://example.com/api/link/namespace/${namespace}?limit=999`;
		const response = await SELF.fetch(url, { method: 'GET' });

		expect(response.status).toBe(200);
		const body = await response.json() as any;
		expect(body.limit).toBe(100);
	});

	it('should return 500 if an unexpected error occurs', async () => {
		vi.spyOn(actions, 'listLinksByNamespaceAction').mockRejectedValueOnce(
			new Error('database connection failed')
		);

		const url = 'https://example.com/api/link/namespace/test-ns';
		const response = await SELF.fetch(url, { method: 'GET' });

		expect(response.status).toBe(500);
		expect(await response.json()).toStrictEqual({
			error: { message: 'Internal server error' },
		});
	});
});
