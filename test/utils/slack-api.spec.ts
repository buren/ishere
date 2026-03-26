import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { slackPostMessage, slackRespondToUrl, slackViewsOpen } from '../../src/utils/slack-api';

const originalFetch = globalThis.fetch;

const mockFetchResponse = (body: Record<string, unknown>, httpOk = true, status = 200) => {
	return vi.fn().mockResolvedValue({
		ok: httpOk,
		status,
		json: () => Promise.resolve(body),
	});
};

describe('slackPostMessage', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it('should call fetch with correct URL, headers, and body', async () => {
		const mockResponse = { ok: true, ts: '1234567890.123456' };
		globalThis.fetch = mockFetchResponse(mockResponse);

		const result = await slackPostMessage('xoxb-test-token', {
			channel: 'C12345',
			text: 'Hello',
			blocks: [{ type: 'section', text: { type: 'mrkdwn', text: 'Hello' } }],
		});

		expect(globalThis.fetch).toHaveBeenCalledWith('https://slack.com/api/chat.postMessage', {
			method: 'POST',
			headers: {
				Authorization: 'Bearer xoxb-test-token',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				channel: 'C12345',
				text: 'Hello',
				blocks: [{ type: 'section', text: { type: 'mrkdwn', text: 'Hello' } }],
			}),
		});

		expect(result).toEqual(mockResponse);
	});

	it('should send without blocks when not provided', async () => {
		globalThis.fetch = mockFetchResponse({ ok: true });

		await slackPostMessage('xoxb-token', { channel: 'C1', text: 'Hi' });

		const body = JSON.parse((globalThis.fetch as any).mock.calls[0][1].body);
		expect(body.blocks).toBeUndefined();
	});

	it('should throw on HTTP error', async () => {
		globalThis.fetch = mockFetchResponse({ ok: false }, false, 500);

		await expect(
			slackPostMessage('xoxb-token', { channel: 'C1', text: 'Hi' })
		).rejects.toThrow('HTTP error: 500');
	});

	it('should throw on Slack API error', async () => {
		globalThis.fetch = mockFetchResponse({ ok: false, error: 'channel_not_found' });

		await expect(
			slackPostMessage('xoxb-token', { channel: 'C1', text: 'Hi' })
		).rejects.toThrow('channel_not_found');
	});
});

describe('slackRespondToUrl', () => {
	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it('should POST to the response URL with correct body', async () => {
		globalThis.fetch = mockFetchResponse({ ok: true });

		const result = await slackRespondToUrl('https://hooks.slack.com/actions/T123/456/abc', {
			text: 'Response text',
			blocks: [{ type: 'section', text: { type: 'mrkdwn', text: 'block' } }],
			replace_original: false,
		});

		expect(globalThis.fetch).toHaveBeenCalledWith('https://hooks.slack.com/actions/T123/456/abc', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				text: 'Response text',
				blocks: [{ type: 'section', text: { type: 'mrkdwn', text: 'block' } }],
				replace_original: false,
			}),
		});

		expect(result).toEqual({ ok: true });
	});

	it('should throw on HTTP error', async () => {
		globalThis.fetch = mockFetchResponse({}, false, 502);

		await expect(
			slackRespondToUrl('https://hooks.slack.com/actions/T123/456/abc', { text: 'Hi' })
		).rejects.toThrow('HTTP error: 502');
	});
});

describe('slackViewsOpen', () => {
	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it('should call views.open with correct token, trigger_id, and view', async () => {
		const mockResponse = { ok: true };
		globalThis.fetch = mockFetchResponse(mockResponse);

		const view = { type: 'modal', title: { type: 'plain_text', text: 'Test' } };
		const result = await slackViewsOpen('xoxb-test-token', {
			trigger_id: 'trigger-abc',
			view,
		});

		expect(globalThis.fetch).toHaveBeenCalledWith('https://slack.com/api/views.open', {
			method: 'POST',
			headers: {
				Authorization: 'Bearer xoxb-test-token',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ trigger_id: 'trigger-abc', view }),
		});

		expect(result).toEqual(mockResponse);
	});

	it('should throw on Slack API error', async () => {
		globalThis.fetch = mockFetchResponse({ ok: false, error: 'trigger_expired' });

		await expect(
			slackViewsOpen('xoxb-token', { trigger_id: 'old', view: {} })
		).rejects.toThrow('trigger_expired');
	});
});
