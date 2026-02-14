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
		vi.useFakeTimers();
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		vi.useRealTimers();
	});

	it('should POST with correct payload including event ID', async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

		await notifyWebhook({ event: 'link.created', link: mockLink, env: makeEnv() });

		expect(globalThis.fetch).toHaveBeenCalledOnce();
		const [url, opts] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
		expect(url).toBe('https://hooks.example.com/webhook');
		expect(opts.method).toBe('POST');

		const body = JSON.parse(opts.body);
		expect(body.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
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

	it('should retry on 5xx response with exponential backoff', async () => {
		globalThis.fetch = vi
			.fn()
			.mockResolvedValueOnce({ ok: false, status: 503 })
			.mockResolvedValueOnce({ ok: false, status: 500 })
			.mockResolvedValueOnce({ ok: true });

		const promise = notifyWebhook({ event: 'link.created', link: mockLink, env: makeEnv() });

		// First retry after 1000ms
		await vi.advanceTimersByTimeAsync(1000);
		// Second retry after 2000ms
		await vi.advanceTimersByTimeAsync(2000);

		await promise;

		expect(globalThis.fetch).toHaveBeenCalledTimes(3);
	});

	it('should retry on 429 response', async () => {
		globalThis.fetch = vi
			.fn()
			.mockResolvedValueOnce({ ok: false, status: 429 })
			.mockResolvedValueOnce({ ok: true });

		const promise = notifyWebhook({ event: 'link.created', link: mockLink, env: makeEnv() });
		await vi.advanceTimersByTimeAsync(1000);
		await promise;

		expect(globalThis.fetch).toHaveBeenCalledTimes(2);
	});

	it('should not retry on 4xx client errors (except 429)', async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 400 });

		await notifyWebhook({ event: 'link.created', link: mockLink, env: makeEnv() });

		expect(globalThis.fetch).toHaveBeenCalledOnce();
	});

	it('should retry on network errors', async () => {
		globalThis.fetch = vi
			.fn()
			.mockRejectedValueOnce(new Error('Network error'))
			.mockResolvedValueOnce({ ok: true });

		const promise = notifyWebhook({ event: 'link.created', link: mockLink, env: makeEnv() });
		await vi.advanceTimersByTimeAsync(1000);
		await promise;

		expect(globalThis.fetch).toHaveBeenCalledTimes(2);
	});

	it('should not throw after all retries are exhausted', async () => {
		globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

		const promise = notifyWebhook({ event: 'link.created', link: mockLink, env: makeEnv() });

		// Advance through all retry delays: 1000 + 2000 + 4000
		await vi.advanceTimersByTimeAsync(1000);
		await vi.advanceTimersByTimeAsync(2000);
		await vi.advanceTimersByTimeAsync(4000);

		await expect(promise).resolves.toBeUndefined();
		// 1 initial + 3 retries
		expect(globalThis.fetch).toHaveBeenCalledTimes(4);
	});

	it('should send the same body (and event ID) on retries', async () => {
		globalThis.fetch = vi
			.fn()
			.mockResolvedValueOnce({ ok: false, status: 502 })
			.mockResolvedValueOnce({ ok: true });

		const promise = notifyWebhook({ event: 'link.created', link: mockLink, env: makeEnv() });
		await vi.advanceTimersByTimeAsync(1000);
		await promise;

		const body1 = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body;
		const body2 = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[1][1].body;
		expect(body1).toBe(body2);
	});
});
