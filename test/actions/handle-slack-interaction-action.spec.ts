import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleSlackInteractionAction } from '../../src/actions/handle-slack-interaction-action';

const originalFetch = globalThis.fetch;

const makePayload = (actionId: string, value: string) => ({
	type: 'block_actions',
	response_url: 'https://hooks.slack.com/actions/T123/456/abc',
	actions: [{ action_id: actionId, value }],
});

const baseParams = {
	requestUrl: 'https://example.com',
	env: {} as Env,
};

describe('handleSlackInteractionAction', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it('should handle edit_destination by posting usage instructions', async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			json: () => Promise.resolve({ ok: true }),
		});

		await handleSlackInteractionAction({
			...baseParams,
			payload: makePayload('edit_destination', 'my-link-id'),
		});

		expect(globalThis.fetch).toHaveBeenCalledTimes(1);
		const [url, opts] = (globalThis.fetch as any).mock.calls[0];
		expect(url).toBe('https://hooks.slack.com/actions/T123/456/abc');

		const body = JSON.parse(opts.body);
		expect(body.text).toContain('/ishere update my-link-id');
		expect(body.replace_original).toBe(false);
	});

	it('should do nothing if no actions are present', async () => {
		globalThis.fetch = vi.fn();

		await handleSlackInteractionAction({
			...baseParams,
			payload: {
				type: 'block_actions',
				response_url: 'https://hooks.slack.com/actions/T123/456/abc',
				actions: [],
			},
		});

		expect(globalThis.fetch).not.toHaveBeenCalled();
	});
});
