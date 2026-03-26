import { env } from 'cloudflare:test';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLinkWithD1Fallback } from '../../src/utils/get-link-with-d1-fallback';
import { kvCreateLink } from '../../src/kv/kv-create-link';
import { kvGetLink } from '../../src/kv/kv-get-link';
import { dbCreateLink } from '../../src/db/db-create-link';

describe('getLinkWithD1Fallback', () => {
	const testDate = new Date('2024-07-26T10:00:00.000Z');

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(testDate);
	});

	it('should return link from KV when present', async () => {
		await kvCreateLink(env.KV, {
			id: 'kv-hit',
			destinationUrl: 'https://example.com',
		});

		const result = await getLinkWithD1Fallback(env, 'kv-hit');
		expect(result).not.toBeNull();
		expect(result!.destinationUrl).toBe('https://example.com');
	});

	it('should fall back to D1 when KV misses', async () => {
		await dbCreateLink(env.D1, {
			id: 'd1-only',
			destinationUrl: 'https://d1-example.com',
			redirectStatusCode: 302,
			createdAt: testDate.toISOString(),
			updatedAt: testDate.toISOString(),
			expiresAt: null,
		});

		// No ctx provided — KV put is awaited directly
		const result = await getLinkWithD1Fallback(env, 'd1-only');
		expect(result).not.toBeNull();
		expect(result!.destinationUrl).toBe('https://d1-example.com');
	});

	it('should populate KV cache on D1 hit', async () => {
		await dbCreateLink(env.D1, {
			id: 'cache-fill',
			destinationUrl: 'https://cached.com',
			redirectStatusCode: 302,
			createdAt: testDate.toISOString(),
			updatedAt: testDate.toISOString(),
			expiresAt: null,
		});

		// No ctx — KV put is awaited inline
		await getLinkWithD1Fallback(env, 'cache-fill');

		const kvValue = await kvGetLink(env.KV, 'cache-fill');
		expect(kvValue).not.toBeNull();
		expect(kvValue!.destinationUrl).toBe('https://cached.com');
	});

	it('should return null when both KV and D1 miss', async () => {
		const result = await getLinkWithD1Fallback(env, 'nonexistent');
		expect(result).toBeNull();
	});

	it('should use ctx.waitUntil for KV backfill when ctx is provided', async () => {
		await dbCreateLink(env.D1, {
			id: 'waituntil-test',
			destinationUrl: 'https://waituntil.com',
			redirectStatusCode: 302,
			createdAt: testDate.toISOString(),
			updatedAt: testDate.toISOString(),
			expiresAt: null,
		});

		const promises: Promise<unknown>[] = [];
		const waitUntil = (p: Promise<unknown>) => { promises.push(p); };
		await getLinkWithD1Fallback(env, 'waituntil-test', { waitUntil });

		expect(promises).toHaveLength(1);
		// Await the background promise to prevent storage isolation errors
		await Promise.all(promises);
	});
});
