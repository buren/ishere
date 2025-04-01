import { describe, expect, it } from 'vitest';
import { LinkKVSchema } from '../../src/types';
import { linkWithUrl } from '../../src/utils/link-with-url';

describe('linkWithUrl', () => {
	it('should generate a URL with namespace', () => {
		const url = 'https://example.com/some/path';
		const link: LinkKVSchema = {
			id: 'namespace-123',
			namespace: 'namespace',
			destinationUrl: 'https://destination.com',
			createdAt: '2024-10-27T10:00:00Z',
			updatedAt: '2024-10-27T10:00:00Z',
		};

		const result = linkWithUrl(url, link);

		expect(result.url).toBe('https://example.com/namespace/123');
		expect(result.qrUrl).toBe('https://example.com/namespace/123/qr');
		expect(result.destinationUrl).toBe('https://destination.com');
		expect(result.id).toBe('namespace-123');
		expect(result.namespace).toBe('namespace');
		expect(result.createdAt).toBe('2024-10-27T10:00:00Z');
		expect(result.updatedAt).toBe('2024-10-27T10:00:00Z');
	});

	it('should generate a URL without namespace', () => {
		const url = 'https://example.com/another/path';
		const link: LinkKVSchema = {
			id: '456',
			destinationUrl: 'https://another-destination.com',
			createdAt: '2024-10-27T11:00:00Z',
			updatedAt: '2024-10-27T11:00:00Z',
		};

		const result = linkWithUrl(url, link);

		expect(result.url).toBe('https://example.com/456');
		expect(result.qrUrl).toBe('https://example.com/456/qr');
		expect(result.destinationUrl).toBe('https://another-destination.com');
		expect(result.id).toBe('456');
		expect(result.namespace).toBeUndefined();
		expect(result.createdAt).toBe('2024-10-27T11:00:00Z');
		expect(result.updatedAt).toBe('2024-10-27T11:00:00Z');
	});

	it('should handle null namespace', () => {
		const url = 'https://example.com/yet/another/path';
		const link: LinkKVSchema = {
			id: 'test-789',
			namespace: null,
			destinationUrl: 'https://yetanother-destination.com',
			createdAt: '2024-10-27T12:00:00Z',
			updatedAt: '2024-10-27T12:00:00Z',
		};

		const result = linkWithUrl(url, link);

		expect(result.url).toBe('https://example.com/test-789');
		expect(result.qrUrl).toBe('https://example.com/test-789/qr');
		expect(result.destinationUrl).toBe('https://yetanother-destination.com');
		expect(result.id).toBe('test-789');
		expect(result.namespace).toBeNull();
		expect(result.createdAt).toBe('2024-10-27T12:00:00Z');
		expect(result.updatedAt).toBe('2024-10-27T12:00:00Z');
	});

	it('should handle an id that is exactly the namespace plus a dash and something else', () => {
		const url = 'https://example.com/yet/another/path';
		const link: LinkKVSchema = {
			id: 'test-123',
			namespace: 'test',
			destinationUrl: 'https://yetanother-destination.com',
			createdAt: '2024-10-27T12:00:00Z',
			updatedAt: '2024-10-27T12:00:00Z',
		};

		const result = linkWithUrl(url, link);

		expect(result.url).toBe('https://example.com/test/123');
		expect(result.qrUrl).toBe('https://example.com/test/123/qr');
	});

	it('should handle an id with a namespace that is a substring of the id', () => {
		const url = 'https://example.com/yet/another/path';
		const link: LinkKVSchema = {
			id: 'testtest-test123',
			namespace: 'testtest',
			destinationUrl: 'https://yetanother-destination.com',
			createdAt: '2024-10-27T12:00:00Z',
			updatedAt: '2024-10-27T12:00:00Z',
		};

		const result = linkWithUrl(url, link);

		expect(result.url).toBe('https://example.com/testtest/test123');
		expect(result.qrUrl).toBe('https://example.com/testtest/test123/qr');
	});
});
