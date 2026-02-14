import { env } from 'cloudflare:test';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dbCreateLink, dbGetLink, dbGetLinksByNamespace, dbDeleteOldLinks } from '../../src/db';
import { LinkKVSchema } from '../../src/types';

const makeLink = (overrides: Partial<LinkKVSchema> & { id: string }): LinkKVSchema => ({
	destinationUrl: 'https://example.com',
	namespace: null,
	expirationTtl: null,
	createdAt: '2024-07-26T10:00:00.000Z',
	updatedAt: '2024-07-26T10:00:00.000Z',
	expiresAt: null,
	redirectStatusCode: 302,
	...overrides,
});

describe('DB layer', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2024-07-26T12:00:00.000Z'));
	});

	describe('dbCreateLink', () => {
		it('should reject duplicate IDs', async () => {
			const link = makeLink({ id: 'dup-test' });
			await dbCreateLink(env.D1, link);

			await expect(dbCreateLink(env.D1, link)).rejects.toThrow();
		});
	});

	describe('dbDeleteOldLinks', () => {
		it('should delete expired links', async () => {
			const expired = makeLink({
				id: 'expired-link',
				expiresAt: '2024-07-26T11:00:00.000Z', // 1 hour ago
				expirationTtl: 3600,
			});
			await dbCreateLink(env.D1, expired);

			const count = await dbDeleteOldLinks(env.D1);

			expect(count).toBe(1);
			const result = await dbGetLink(env.D1, { id: 'expired-link' });
			expect(result).toBeNull();
		});

		it('should not delete links that have not expired', async () => {
			const active = makeLink({
				id: 'active-link',
				expiresAt: '2024-07-26T13:00:00.000Z', // 1 hour from now
				expirationTtl: 3600,
			});
			await dbCreateLink(env.D1, active);

			const count = await dbDeleteOldLinks(env.D1);

			expect(count).toBe(0);
			const result = await dbGetLink(env.D1, { id: 'active-link' });
			expect(result).not.toBeNull();
		});

		it('should not delete links without expiration', async () => {
			const permanent = makeLink({ id: 'permanent-link' });
			await dbCreateLink(env.D1, permanent);

			const count = await dbDeleteOldLinks(env.D1);

			expect(count).toBe(0);
			const result = await dbGetLink(env.D1, { id: 'permanent-link' });
			expect(result).not.toBeNull();
		});

		it('should only delete expired links in a mixed set', async () => {
			await dbCreateLink(env.D1, makeLink({
				id: 'mix-expired',
				expiresAt: '2024-07-26T11:00:00.000Z',
				expirationTtl: 3600,
			}));
			await dbCreateLink(env.D1, makeLink({
				id: 'mix-active',
				expiresAt: '2024-07-26T13:00:00.000Z',
				expirationTtl: 3600,
			}));
			await dbCreateLink(env.D1, makeLink({ id: 'mix-permanent' }));

			const count = await dbDeleteOldLinks(env.D1);

			expect(count).toBe(1);
			expect(await dbGetLink(env.D1, { id: 'mix-expired' })).toBeNull();
			expect(await dbGetLink(env.D1, { id: 'mix-active' })).not.toBeNull();
			expect(await dbGetLink(env.D1, { id: 'mix-permanent' })).not.toBeNull();
		});
	});

	describe('dbGetLinksByNamespace', () => {
		it('should return paginated results with correct total', async () => {
			for (let i = 0; i < 5; i++) {
				await dbCreateLink(env.D1, makeLink({
					id: `ns-page-${i}`,
					namespace: 'paginated',
				}));
			}

			const page1 = await dbGetLinksByNamespace(env.D1, {
				namespace: 'paginated',
				limit: 2,
				offset: 0,
			});

			expect(page1.links).toHaveLength(2);
			expect(page1.total).toBe(5);

			const page3 = await dbGetLinksByNamespace(env.D1, {
				namespace: 'paginated',
				limit: 2,
				offset: 4,
			});

			expect(page3.links).toHaveLength(1);
			expect(page3.total).toBe(5);
		});

		it('should return empty results for non-existent namespace', async () => {
			const result = await dbGetLinksByNamespace(env.D1, {
				namespace: 'does-not-exist',
				limit: 10,
				offset: 0,
			});

			expect(result.links).toStrictEqual([]);
			expect(result.total).toBe(0);
		});

		it('should not return links from other namespaces', async () => {
			await dbCreateLink(env.D1, makeLink({ id: 'ns-a-1', namespace: 'ns-a' }));
			await dbCreateLink(env.D1, makeLink({ id: 'ns-b-1', namespace: 'ns-b' }));

			const result = await dbGetLinksByNamespace(env.D1, {
				namespace: 'ns-a',
				limit: 10,
				offset: 0,
			});

			expect(result.links).toHaveLength(1);
			expect(result.links[0].id).toBe('ns-a-1');
		});
	});
});
