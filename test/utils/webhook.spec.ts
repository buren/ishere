import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { notifyWebhook } from '../../src/utils/webhook';
import { LinkWithUrls } from '../../src/utils/link-with-url';

const originalFetch = globalThis.fetch;

const mockLink: LinkWithUrls = {
	id: 'abc123',
	destinationUrl: 'https://example.com',
	url: 'https://short.io/abc123',
	qrUrl: 'https://short.io/abc123/qr',
	passwordProtected: false,
	createdAt: '2025-01-01T00:00:00.000Z',
	updatedAt: '2025-01-01T00:00:00.000Z',
	expiresAt: null,
	redirectStatusCode: 302,
};

const makeEnv = (overrides: Partial<Env> = {}): Env =>
	({
		WEBHOOK_URL: 'https://hooks.example.com/webhook',
		WEBHOOK_SECRET: 'test-secret',
		...overrides,
	}) as unknown as Env;

describe('notifyWebhook', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it('should POST with correct payload when WEBHOOK_URL is set', async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

		await notifyWebhook({ event: 'link.created', link: mockLink, env: makeEnv() });

		expect(globalThis.fetch).toHaveBeenCalledOnce();
		const [url, opts] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
		expect(url).toBe('https://hooks.example.com/webhook');
		expect(opts.method).toBe('POST');

		const body = JSON.parse(opts.body);
		expect(body.event).toBe('link.created');
		expect(body.timestamp).toBeDefined();
		expect(body.link).toEqual(mockLink);
	});

	it('should include HMAC signature header when WEBHOOK_SECRET is set', async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

		await notifyWebhook({ event: 'link.created', link: mockLink, env: makeEnv() });

		const [, opts] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
		expect(opts.headers['X-Webhook-Signature-256']).toMatch(/^sha256=[0-9a-f]{64}$/);
	});

	it('should not include signature header when WEBHOOK_SECRET is not set', async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

		await notifyWebhook({ event: 'link.updated', link: mockLink, env: makeEnv({ WEBHOOK_SECRET: undefined }) });

		const [, opts] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
		expect(opts.headers['X-Webhook-Signature-256']).toBeUndefined();
	});

	it('should do nothing when WEBHOOK_URL is not set', async () => {
		globalThis.fetch = vi.fn();

		await notifyWebhook({ event: 'link.deleted', link: mockLink, env: makeEnv({ WEBHOOK_URL: undefined }) });

		expect(globalThis.fetch).not.toHaveBeenCalled();
	});

	it('should not throw on fetch failure', async () => {
		globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

		await expect(
			notifyWebhook({ event: 'link.created', link: mockLink, env: makeEnv() })
		).resolves.toBeUndefined();
	});
});
