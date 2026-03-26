import { describe, it, expect, vi, afterEach } from 'vitest';
import { linkRedirectsAnalytics } from '../../src/analytics/link-redirects-analytics';

const originalFetch = globalThis.fetch;

const makeEnv = (overrides: Partial<Env> = {}) =>
	({
		ACCOUNT_ID: 'test-account',
		ANALYTICS_API_TOKEN: 'test-token',
		...overrides,
	}) as unknown as Env;

const mockAnalyticsResponse = (data: Record<string, unknown>[] = [], rows = data.length) => ({
	meta: [],
	data,
	rows,
	rows_before_limit_at_least: rows,
});

describe('linkRedirectsAnalytics', () => {
	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it('should throw on invalid id', async () => {
		await expect(
			linkRedirectsAnalytics(makeEnv(), { id: 'invalid id!', groupBySeconds: 3600 })
		).rejects.toThrow('Invalid id');
	});

	it('should throw on non-positive groupBySeconds', async () => {
		await expect(
			linkRedirectsAnalytics(makeEnv(), { id: 'valid-id', groupBySeconds: 0 })
		).rejects.toThrow('Invalid groupBySeconds');
	});

	it('should construct correct API call', async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockAnalyticsResponse()),
		});

		await linkRedirectsAnalytics(makeEnv(), { id: 'test-link', groupBySeconds: 3600 });

		expect(globalThis.fetch).toHaveBeenCalledTimes(1);
		const [url, opts] = (globalThis.fetch as any).mock.calls[0];
		expect(url).toContain('test-account');
		expect(opts.headers.Authorization).toBe('Bearer test-token');
		expect(opts.body).toContain("index1 = 'test-link'");
	});

	it('should transform response data correctly', async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () =>
				Promise.resolve(
					mockAnalyticsResponse([
						{ id: 'link1', datetime: '2024-01-01', totalRedirects: 10, botRedirects: 2, nonBotRedirects: 8 },
						{ id: 'link1', datetime: '2024-01-02', totalRedirects: 5, botRedirects: 1, nonBotRedirects: 4 },
					])
				),
		});

		const result = await linkRedirectsAnalytics(makeEnv(), { id: 'link1', groupBySeconds: 86400 });

		expect(result.totalRows).toBe(2);
		expect(result.totalRedirects).toBe(15);
		expect(result.botRedirects).toBe(3);
		expect(result.nonBotRedirects).toBe(12);
		expect(result.data).toHaveLength(2);
		expect(result.data[0].datetime).toBe('2024-01-01');
	});

	it('should throw on API error', async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 500,
			text: () => Promise.resolve('Internal Server Error'),
		});

		await expect(
			linkRedirectsAnalytics(makeEnv(), { id: 'test-link', groupBySeconds: 3600 })
		).rejects.toThrow('An error occurred while querying analytics data');
	});

	it('should include bot filter when excludeBotTraffic is true', async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockAnalyticsResponse()),
		});

		await linkRedirectsAnalytics(makeEnv(), { id: 'test-link', groupBySeconds: 3600, excludeBotTraffic: true });

		const body = (globalThis.fetch as any).mock.calls[0][1].body;
		expect(body).toContain("!= 'true'");
	});
});
