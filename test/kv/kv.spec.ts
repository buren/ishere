import { env } from 'cloudflare:test';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { kvCreateLink } from '../../src/kv/kv-create-link';
import { kvGetLink } from '../../src/kv/kv-get-link';
import { kvUpdateLink } from '../../src/kv/kv-update-link';

describe('KV layer', () => {
	const testDate = new Date('2024-07-26T10:00:00.000Z');
	const testDateISO = testDate.toISOString();

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(testDate);
	});

	describe('kvCreateLink', () => {
		it('should create a link with timestamps', async () => {
			const link = await kvCreateLink(env.KV, {
				id: 'kv-create-test',
				destinationUrl: 'https://example.com',
			});

			expect(link.id).toBe('kv-create-test');
			expect(link.destinationUrl).toBe('https://example.com');
			expect(link.createdAt).toBe(testDateISO);
			expect(link.updatedAt).toBe(testDateISO);
			expect(link.namespace).toBeNull();
			expect(link.expirationTtl).toBeNull();
			expect(link.expiresAt).toBeNull();
			expect(link.redirectStatusCode).toBe(302);
		});

		it('should compute expiresAt from expirationTtl', async () => {
			const link = await kvCreateLink(env.KV, {
				id: 'kv-ttl-test',
				destinationUrl: 'https://example.com',
				expirationTtl: 3600,
			});

			expect(link.expirationTtl).toBe(3600);
			expect(link.expiresAt).toBe('2024-07-26T11:00:00.000Z');
		});

		it('should store namespace when provided', async () => {
			const link = await kvCreateLink(env.KV, {
				id: 'kv-ns-test',
				destinationUrl: 'https://example.com',
				namespace: 'my-brand',
			});

			expect(link.namespace).toBe('my-brand');
		});

		it('should persist link to KV and be retrievable', async () => {
			await kvCreateLink(env.KV, {
				id: 'kv-persist-test',
				destinationUrl: 'https://example.com',
			});

			const retrieved = await kvGetLink(env.KV, 'kv-persist-test');
			expect(retrieved).not.toBeNull();
			expect(retrieved.id).toBe('kv-persist-test');
			expect(retrieved.destinationUrl).toBe('https://example.com');
		});
	});

	describe('kvUpdateLink', () => {
		it('should update destinationUrl while preserving other fields', async () => {
			const original = await kvCreateLink(env.KV, {
				id: 'kv-update-url',
				destinationUrl: 'https://old.example.com',
				namespace: 'test-ns',
			});

			vi.setSystemTime(new Date('2024-07-26T11:00:00.000Z'));

			const updated = await kvUpdateLink(env.KV, original, {
				destinationUrl: 'https://new.example.com',
			});

			expect(updated.destinationUrl).toBe('https://new.example.com');
			expect(updated.namespace).toBe('test-ns');
			expect(updated.createdAt).toBe(testDateISO);
			expect(updated.updatedAt).toBe('2024-07-26T11:00:00.000Z');
		});

		it('should update expirationTtl and recompute expiresAt', async () => {
			const original = await kvCreateLink(env.KV, {
				id: 'kv-update-ttl',
				destinationUrl: 'https://example.com',
			});

			vi.setSystemTime(new Date('2024-07-26T11:00:00.000Z'));

			const updated = await kvUpdateLink(env.KV, original, {
				expirationTtl: 7200,
			});

			expect(updated.expirationTtl).toBe(7200);
			expect(updated.expiresAt).toBe('2024-07-26T13:00:00.000Z');
		});

		it('should keep existing destinationUrl when not provided', async () => {
			const original = await kvCreateLink(env.KV, {
				id: 'kv-update-keep',
				destinationUrl: 'https://keep.example.com',
			});

			const updated = await kvUpdateLink(env.KV, original, {
				expirationTtl: 3600,
			});

			expect(updated.destinationUrl).toBe('https://keep.example.com');
		});

		it('should persist updated link to KV', async () => {
			const original = await kvCreateLink(env.KV, {
				id: 'kv-update-persist',
				destinationUrl: 'https://old.example.com',
			});

			await kvUpdateLink(env.KV, original, {
				destinationUrl: 'https://new.example.com',
			});

			const retrieved = await kvGetLink(env.KV, 'kv-update-persist');
			expect(retrieved.destinationUrl).toBe('https://new.example.com');
		});
	});
});
