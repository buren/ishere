import { describe, it, expect, vi } from 'vitest';
import trackLinkRedirect from '../../src/analytics/track-link-redirect';

const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const makeRequest = (userAgent = BROWSER_UA, cf: Record<string, string> = {}) =>
	({
		headers: new Headers({ 'user-agent': userAgent }),
		cf,
	}) as unknown as Request;

const makeEnv = () => ({
	REDIRECTS: {
		writeDataPoint: vi.fn(),
	},
}) as unknown as Env;

describe('trackLinkRedirect', () => {
	it('should write a data point with correct structure', async () => {
		const env = makeEnv();
		await trackLinkRedirect('test-id', makeRequest(BROWSER_UA, {
			colo: 'SFO',
			country: 'US',
			region: 'CA',
			city: 'San Francisco',
			metroCode: '807',
			timezone: 'America/Los_Angeles',
			latitude: '37.7749',
			longitude: '-122.4194',
		}), env);

		expect(env.REDIRECTS.writeDataPoint).toHaveBeenCalledTimes(1);
		const args = env.REDIRECTS.writeDataPoint.mock.calls[0][0];

		expect(args.indexes).toEqual(['test-id']);
		expect(args.blobs[0]).toBe(BROWSER_UA);
		expect(args.blobs[1]).toBe('SFO');
		expect(args.blobs[2]).toBe('US');
		expect(args.blobs[3]).toBe('CA');
		expect(args.blobs[4]).toBe('San Francisco');
		expect(args.blobs[7]).toBe('false'); // not a bot
		expect(args.doubles[0]).toBeCloseTo(37.7749);
		expect(args.doubles[1]).toBeCloseTo(-122.4194);
	});

	it('should detect bot user agents', async () => {
		const env = makeEnv();
		await trackLinkRedirect('bot-test', makeRequest('Googlebot/2.1'), env);

		const args = env.REDIRECTS.writeDataPoint.mock.calls[0][0];
		expect(args.blobs[7]).toBe('true');
	});

	it('should handle missing cf properties gracefully', async () => {
		const env = makeEnv();
		await trackLinkRedirect('no-cf', makeRequest(BROWSER_UA), env);

		const args = env.REDIRECTS.writeDataPoint.mock.calls[0][0];
		expect(args.blobs[1]).toBeNull(); // colo
		expect(args.doubles[0]).toBe(0); // latitude default
		expect(args.doubles[1]).toBe(0); // longitude default
	});

	it('should handle missing user-agent header', async () => {
		const env = makeEnv();
		const request = {
			headers: new Headers(),
			cf: {},
		} as unknown as Request;

		await trackLinkRedirect('no-ua', request, env);

		const args = env.REDIRECTS.writeDataPoint.mock.calls[0][0];
		expect(args.blobs[0]).toBe('unknown');
	});

	it('should catch and log write errors', async () => {
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const env = {
			REDIRECTS: {
				writeDataPoint: vi.fn().mockImplementation(() => { throw new Error('write failed'); }),
			},
		} as unknown as Env;

		await trackLinkRedirect('error-test', makeRequest(), env);

		expect(consoleSpy).toHaveBeenCalledWith('Analytics write failed:', expect.any(Error));
		consoleSpy.mockRestore();
	});
});
