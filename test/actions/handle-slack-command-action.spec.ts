import { env } from 'cloudflare:test';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleSlackCommandAction } from '../../src/actions/handle-slack-command-action';
import { dbCreateLink } from '../../src/db/db-create-link';

const getResponseText = (result: Record<string, unknown>): string => {
	if (typeof result.text === 'string') return result.text;
	const blocks = result.blocks as { text: { text: string } }[];
	return blocks?.[0]?.text?.text ?? '';
};

describe('handleSlackCommandAction', () => {
	const testDate = new Date('2024-07-26T10:00:00.000Z');

	const makeCtx = () => {
		const promises: Promise<unknown>[] = [];
		return {
			waitUntil: (p: Promise<unknown>) => { promises.push(p); },
			flush: () => Promise.allSettled(promises),
		};
	};

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(testDate);
	});

	it('should return help text for help command', async () => {
		const result = await handleSlackCommandAction({
			text: 'help',
			url: 'https://example.com',
			env,
			ctx: makeCtx(),
		});

		const text = getResponseText(result);
		expect(text).toContain('/ishere');
	});

	it('should return invalid command message for unknown commands', async () => {
		const result = await handleSlackCommandAction({
			text: 'unknown',
			url: 'https://example.com',
			env,
			ctx: makeCtx(),
		});

		expect(result.text).toContain('Invalid command');
	});

	it('should return link info for get command', async () => {
		await dbCreateLink(env.D1, {
			id: 'slack-get-test',
			destinationUrl: 'https://target.com',
			redirectStatusCode: 302,
			createdAt: testDate.toISOString(),
			updatedAt: testDate.toISOString(),
			expiresAt: null,
		});

		const result = await handleSlackCommandAction({
			text: 'get slack-get-test',
			url: 'https://example.com',
			env,
			ctx: makeCtx(),
		});

		const text = getResponseText(result);
		expect(text).toContain('https://target.com');
	});

	it('should return not found for get command with nonexistent id', async () => {
		const result = await handleSlackCommandAction({
			text: 'get nonexistent',
			url: 'https://example.com',
			env,
			ctx: makeCtx(),
		});

		expect(result.text).toContain('No link with that id exists');
	});

	it('should return detailed link info for details command', async () => {
		await dbCreateLink(env.D1, {
			id: 'slack-details-test',
			destinationUrl: 'https://detail-target.com',
			namespace: 'ns',
			redirectStatusCode: 302,
			createdAt: testDate.toISOString(),
			updatedAt: testDate.toISOString(),
			expiresAt: null,
		});

		const result = await handleSlackCommandAction({
			text: 'details slack-details-test',
			url: 'https://example.com',
			env,
			ctx: makeCtx(),
		});

		const text = getResponseText(result);
		expect(text).toContain('slack-details-test');
		expect(text).toContain('https://detail-target.com');
	});

	it('should create a link for create command', async () => {
		const ctx = makeCtx();
		const result = await handleSlackCommandAction({
			text: 'create https://new-link.com',
			url: 'https://example.com',
			env,
			ctx,
		});

		// Await background tasks (KV write, Slack notify, webhook) to prevent storage isolation errors
		await ctx.flush();

		const text = getResponseText(result);
		expect(text).toContain('https://new-link.com');
		expect(text).toContain(':link:');
	});

	it('should return analytics not configured for stats when env is missing', async () => {
		const envWithoutAnalytics = { ...env, ACCOUNT_ID: undefined, ANALYTICS_API_TOKEN: undefined } as unknown as Env;
		const result = await handleSlackCommandAction({
			text: 'stats some-id',
			url: 'https://example.com',
			env: envWithoutAnalytics,
			ctx: makeCtx(),
		});

		expect(result.text).toContain('Analytics is not configured');
	});

	it('should return not found for stats with nonexistent link', async () => {
		const envWithAnalytics = { ...env, ACCOUNT_ID: 'acc', ANALYTICS_API_TOKEN: 'tok' } as unknown as Env;
		const result = await handleSlackCommandAction({
			text: 'stats nonexistent',
			url: 'https://example.com',
			env: envWithAnalytics,
			ctx: makeCtx(),
		});

		expect(result.text).toContain('No link with that id exists');
	});
});
