import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

const SIGNING_SECRET = 'test-signing-secret';

const sign = async (timestamp: string, body: string): Promise<string> => {
	const baseString = `v0:${timestamp}:${body}`;
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(SIGNING_SECRET),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(baseString));
	const hex = Array.from(new Uint8Array(sig))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
	return `v0=${hex}`;
};

const makePayload = (actionId: string, value: string) =>
	JSON.stringify({
		type: 'block_actions',
		response_url: 'https://hooks.slack.com/actions/T123/456/abc',
		actions: [{ action_id: actionId, value }],
	});

describe('Slack Signature Verification Middleware', () => {
	it('should reject request with missing signature headers', async () => {
		const response = await SELF.fetch('https://example.com/api/slack/interact', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: 'payload=' + encodeURIComponent(makePayload('view_stats', 'abc')),
		});

		expect(response.status).toBe(401);
		const data = (await response.json()) as any;
		expect(data.error.message).toBe('Missing Slack signature headers');
	});

	it('should reject request with stale timestamp', async () => {
		const staleTimestamp = String(Math.floor(Date.now() / 1000) - 60 * 10);
		const body = 'payload=' + encodeURIComponent(makePayload('view_stats', 'abc'));
		const signature = await sign(staleTimestamp, body);

		const response = await SELF.fetch('https://example.com/api/slack/interact', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'X-Slack-Request-Timestamp': staleTimestamp,
				'X-Slack-Signature': signature,
			},
			body,
		});

		expect(response.status).toBe(401);
		const data = (await response.json()) as any;
		expect(data.error.message).toBe('Slack request timestamp is too old');
	});

	it('should reject request with invalid signature', async () => {
		const timestamp = String(Math.floor(Date.now() / 1000));
		const body = 'payload=' + encodeURIComponent(makePayload('view_stats', 'abc'));

		const response = await SELF.fetch('https://example.com/api/slack/interact', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'X-Slack-Request-Timestamp': timestamp,
				'X-Slack-Signature': 'v0=invalidsignature1234567890abcdef1234567890abcdef1234567890abcdef',
			},
			body,
		});

		expect(response.status).toBe(401);
		const data = (await response.json()) as any;
		expect(data.error.message).toBe('Invalid Slack signature');
	});

	it('should pass request with valid signature', async () => {
		const timestamp = String(Math.floor(Date.now() / 1000));
		const body = 'payload=' + encodeURIComponent(makePayload('edit_destination', 'my-link'));
		const signature = await sign(timestamp, body);

		const response = await SELF.fetch('https://example.com/api/slack/interact', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'X-Slack-Request-Timestamp': timestamp,
				'X-Slack-Signature': signature,
			},
			body,
		});

		expect(response.status).toBe(200);
	});
});
