import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { notifySlackLinkChange } from '../../src/actions/notify-slack-action';

const originalFetch = globalThis.fetch;

const mockFetchOk = () =>
	vi.fn().mockResolvedValue({
		ok: true,
		json: () => Promise.resolve({ ok: true }),
	});

const baseParams = {
	action: 'created',
	linkId: 'abc123',
	shortUrl: 'https://short.io/abc123',
	destinationUrl: 'https://example.com',
};

describe('notifySlackLinkChange', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it('should skip when SLACK_BOT_TOKEN is not set', async () => {
		globalThis.fetch = vi.fn();
		await notifySlackLinkChange({
			...baseParams,
			env: { SLACK_CHANNEL_ID: 'C123' } as Env,
		});
		expect(globalThis.fetch).not.toHaveBeenCalled();
	});

	it('should skip when SLACK_CHANNEL_ID is not set', async () => {
		globalThis.fetch = vi.fn();
		await notifySlackLinkChange({
			...baseParams,
			env: { SLACK_BOT_TOKEN: 'xoxb-test' } as Env,
		});
		expect(globalThis.fetch).not.toHaveBeenCalled();
	});

	it('should call slackPostMessage when both token and channel are set', async () => {
		globalThis.fetch = mockFetchOk();
		await notifySlackLinkChange({
			...baseParams,
			env: { SLACK_BOT_TOKEN: 'xoxb-test', SLACK_CHANNEL_ID: 'C123' } as Env,
		});

		expect(globalThis.fetch).toHaveBeenCalledTimes(1);
		const [url, opts] = (globalThis.fetch as any).mock.calls[0];
		expect(url).toBe('https://slack.com/api/chat.postMessage');

		const body = JSON.parse(opts.body);
		expect(body.channel).toBe('C123');
		expect(body.text).toContain('created');
	});

	it('should not throw when slackPostMessage fails', async () => {
		globalThis.fetch = vi.fn().mockRejectedValue(new Error('network error'));
		await expect(
			notifySlackLinkChange({
				...baseParams,
				env: { SLACK_BOT_TOKEN: 'xoxb-test', SLACK_CHANNEL_ID: 'C123' } as Env,
			})
		).resolves.toBeUndefined();
	});
});
