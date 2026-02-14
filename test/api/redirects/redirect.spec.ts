import { env, SELF } from 'cloudflare:test';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { kvCreateLink } from '../../../src/kv/kv-create-link';
import { dbCreateLink } from '../../../src/db';
import { hashPassword } from '../../../src/utils/hash-password';

describe('Preview routes', () => {
	const testDate = new Date('2024-07-26T10:00:00.000Z');

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(testDate);
	});

	it('should return 200 with HTML preview for /:id/info', async () => {
		const link = await kvCreateLink(env.KV, {
			id: 'preview-test',
			destinationUrl: 'https://example.com/destination',
		});
		await dbCreateLink(env.D1, link);

		const response = await SELF.fetch('https://example.com/preview-test/info');

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toContain('text/html');
		const html = await response.text();
		expect(html).toContain('https://example.com/destination');
	});

	it('should return 200 with HTML preview for /:namespace/:shortPath/info', async () => {
		const link = await kvCreateLink(env.KV, {
			id: 'brand-preview',
			destinationUrl: 'https://example.com/namespaced',
			namespace: 'brand',
		});
		await dbCreateLink(env.D1, link);

		const response = await SELF.fetch('https://example.com/brand/preview/info');

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toContain('text/html');
		const html = await response.text();
		expect(html).toContain('https://example.com/namespaced');
	});

	it('should return 404 for nonexistent link preview', async () => {
		const response = await SELF.fetch('https://example.com/nonexistent/info');

		expect(response.status).toBe(404);
		expect(response.headers.get('content-type')).toContain('text/html');
	});
});

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

describe('Password-protected redirects', () => {
	const testDate = new Date('2024-07-26T10:00:00.000Z');

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(testDate);
	});

	it('should return password form for GET on password-protected link', async () => {
		const password = await hashPassword('secret123');
		const link = await kvCreateLink(env.KV, {
			id: 'pw-link',
			destinationUrl: 'https://example.com/secret',
			password,
		});
		await dbCreateLink(env.D1, link);

		const response = await SELF.fetch('https://example.com/pw-link', { redirect: 'manual' });

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toContain('text/html');
		const html = await response.text();
		expect(html).toContain('Password');
		expect(html).toContain('form');
		expect(html).not.toContain('https://example.com/secret');
	});

	it('should redirect on POST with correct password', async () => {
		const password = await hashPassword('secret123');
		const link = await kvCreateLink(env.KV, {
			id: 'pw-post',
			destinationUrl: 'https://example.com/destination',
			password,
		});
		await dbCreateLink(env.D1, link);

		const formData = new URLSearchParams({ password: 'secret123' });
		const response = await SELF.fetch('https://example.com/pw-post', {
			method: 'POST',
			body: formData.toString(),
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			redirect: 'manual',
		});

		expect(response.status).toBe(302);
		expect(response.headers.get('location')).toBe('https://example.com/destination');
	});

	it('should return error on POST with incorrect password', async () => {
		const password = await hashPassword('secret123');
		const link = await kvCreateLink(env.KV, {
			id: 'pw-wrong',
			destinationUrl: 'https://example.com/destination',
			password,
		});
		await dbCreateLink(env.D1, link);

		const formData = new URLSearchParams({ password: 'wrongpassword' });
		const response = await SELF.fetch('https://example.com/pw-wrong', {
			method: 'POST',
			body: formData.toString(),
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			redirect: 'manual',
		});

		expect(response.status).toBe(200);
		const html = await response.text();
		expect(html).toContain('Incorrect password');
		expect(html).toContain('form');
	});

	it('should still redirect normally on GET for non-password link', async () => {
		const link = await kvCreateLink(env.KV, {
			id: 'no-pw',
			destinationUrl: 'https://example.com',
		});
		await dbCreateLink(env.D1, link);

		const response = await SELF.fetch('https://example.com/no-pw', { redirect: 'manual' });

		expect(response.status).toBe(302);
		expect(response.headers.get('location')).toBe('https://example.com');
	});

	it('should work for namespaced password-protected link', async () => {
		const password = await hashPassword('nspassword');
		const link = await kvCreateLink(env.KV, {
			id: 'brand-secret',
			destinationUrl: 'https://example.com/ns-dest',
			namespace: 'brand',
			password,
		});
		await dbCreateLink(env.D1, link);

		// GET should show password form
		const getResponse = await SELF.fetch('https://example.com/brand/secret', { redirect: 'manual' });
		expect(getResponse.status).toBe(200);
		const html = await getResponse.text();
		expect(html).toContain('Password');

		// POST with correct password should redirect
		const formData = new URLSearchParams({ password: 'nspassword' });
		const postResponse = await SELF.fetch('https://example.com/brand/secret', {
			method: 'POST',
			body: formData.toString(),
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			redirect: 'manual',
		});
		expect(postResponse.status).toBe(302);
		expect(postResponse.headers.get('location')).toBe('https://example.com/ns-dest');
	});
});
