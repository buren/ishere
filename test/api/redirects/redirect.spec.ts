import { env, SELF } from 'cloudflare:test';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { kvCreateLink } from '../../../src/kv/kv-create-link';
import { dbCreateLink } from '../../../src/db';

describe('Redirect routes', () => {
	const testDate = new Date('2024-07-26T10:00:00.000Z');

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(testDate);
	});

	it('should return 302 by default', async () => {
		const link = await kvCreateLink(env.KV, {
			id: 'default-redirect',
			destinationUrl: 'https://example.com',
		});
		await dbCreateLink(env.D1, link);

		const response = await SELF.fetch('https://example.com/default-redirect', { redirect: 'manual' });

		expect(response.status).toBe(302);
		expect(response.headers.get('location')).toBe('https://example.com');
	});

	it('should return 301 when link has redirectStatusCode 301', async () => {
		const link = await kvCreateLink(env.KV, {
			id: 'permanent-redirect',
			destinationUrl: 'https://example.com',
			redirectStatusCode: 301,
		});
		await dbCreateLink(env.D1, link);

		const response = await SELF.fetch('https://example.com/permanent-redirect', { redirect: 'manual' });

		expect(response.status).toBe(301);
		expect(response.headers.get('location')).toBe('https://example.com');
	});

	it('should return 301 for namespaced link with redirectStatusCode 301', async () => {
		const link = await kvCreateLink(env.KV, {
			id: 'brand-perm',
			destinationUrl: 'https://example.com',
			namespace: 'brand',
			redirectStatusCode: 301,
		});
		await dbCreateLink(env.D1, link);

		const response = await SELF.fetch('https://example.com/brand/perm', { redirect: 'manual' });

		expect(response.status).toBe(301);
		expect(response.headers.get('location')).toBe('https://example.com');
	});

	it('should return 302 for namespaced link by default', async () => {
		const link = await kvCreateLink(env.KV, {
			id: 'brand-temp',
			destinationUrl: 'https://example.com',
			namespace: 'brand',
		});
		await dbCreateLink(env.D1, link);

		const response = await SELF.fetch('https://example.com/brand/temp', { redirect: 'manual' });

		expect(response.status).toBe(302);
		expect(response.headers.get('location')).toBe('https://example.com');
	});
});
