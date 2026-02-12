import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import { reservedPaths } from '../../src/utils/constants';

describe('Reserved paths', () => {
	it('should return 404 for reserved path favicon.ico', async () => {
		const response = await SELF.fetch('https://example.com/favicon.ico');
		expect(response.status).toBe(404);
	});

	it('should return 404 for reserved path robots.txt', async () => {
		const response = await SELF.fetch('https://example.com/robots.txt');
		expect(response.status).toBe(404);
	});

	it('should return 404 for reserved path .well-known', async () => {
		const response = await SELF.fetch('https://example.com/.well-known');
		expect(response.status).toBe(404);
	});

	it('should return 404 for all reserved paths without KV/D1 lookup', async () => {
		// openapi.json is reserved but has its own explicit route that returns 200
		const pathsHandledByRedirectRouter = reservedPaths.filter((p) => p !== 'openapi.json');
		for (const path of pathsHandledByRedirectRouter) {
			const response = await SELF.fetch(`https://example.com/${path}`);
			expect(response.status).toBe(404, `Expected 404 for reserved path: ${path}`);
		}
	});

	it('should return 404 for reserved path used as namespace segment', async () => {
		const response = await SELF.fetch('https://example.com/favicon.ico/something');
		expect(response.status).toBe(404);
	});

	it('should return 404 for reserved path with /qr suffix', async () => {
		const response = await SELF.fetch('https://example.com/favicon.ico/qr');
		expect(response.status).toBe(404);
	});
});
