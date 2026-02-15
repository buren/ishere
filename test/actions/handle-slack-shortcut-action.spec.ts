import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleSlackShortcutAction } from '../../src/actions/handle-slack-shortcut-action';

const originalFetch = globalThis.fetch;

const makePayload = (callbackId: string) => ({
	type: 'shortcut' as const,
	callback_id: callbackId,
	trigger_id: 'trigger-123',
});

describe('handleSlackShortcutAction', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it('should call views.open with create_link modal for create_link shortcut', async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			json: () => Promise.resolve({ ok: true }),
		});

		await handleSlackShortcutAction({
			payload: makePayload('create_link'),
			env: { SLACK_BOT_TOKEN: 'xoxb-test' } as Env,
		});

		expect(globalThis.fetch).toHaveBeenCalledTimes(1);
		const [url, opts] = (globalThis.fetch as any).mock.calls[0];
		expect(url).toBe('https://slack.com/api/views.open');

		const body = JSON.parse(opts.body);
		expect(body.trigger_id).toBe('trigger-123');
		expect(body.view.callback_id).toBe('create_link');
		expect(body.view.type).toBe('modal');
	});

	it('should call views.open with look_up_link modal for look_up_link shortcut', async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			json: () => Promise.resolve({ ok: true }),
		});

		await handleSlackShortcutAction({
			payload: makePayload('look_up_link'),
			env: { SLACK_BOT_TOKEN: 'xoxb-test' } as Env,
		});

		expect(globalThis.fetch).toHaveBeenCalledTimes(1);
		const body = JSON.parse((globalThis.fetch as any).mock.calls[0][1].body);
		expect(body.view.callback_id).toBe('look_up_link');
	});

	it('should not call fetch when SLACK_BOT_TOKEN is not set', async () => {
		globalThis.fetch = vi.fn();

		await handleSlackShortcutAction({
			payload: makePayload('create_link'),
			env: {} as Env,
		});

		expect(globalThis.fetch).not.toHaveBeenCalled();
	});

	it('should not call fetch for unknown callback_id', async () => {
		globalThis.fetch = vi.fn();

		await handleSlackShortcutAction({
			payload: makePayload('unknown_action'),
			env: { SLACK_BOT_TOKEN: 'xoxb-test' } as Env,
		});

		expect(globalThis.fetch).not.toHaveBeenCalled();
	});

	it('should not throw on fetch error', async () => {
		globalThis.fetch = vi.fn().mockRejectedValue(new Error('network error'));

		await expect(
			handleSlackShortcutAction({
				payload: makePayload('create_link'),
				env: { SLACK_BOT_TOKEN: 'xoxb-test' } as Env,
			})
		).resolves.toBeUndefined();
	});
});
