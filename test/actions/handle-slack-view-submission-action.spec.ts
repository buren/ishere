import { createExecutionContext, env } from 'cloudflare:test';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleSlackViewSubmissionAction } from '../../src/actions/handle-slack-view-submission-action';
import { dbCreateLink } from '../../src/db';
import { LinkKVSchema } from '../../src/types';

const testDate = new Date('2024-07-26T10:00:00.000Z');
const testDateISO = testDate.toISOString();

type CreatePayloadOpts = {
	destinationUrl: string;
	namespace?: string | null;
	shortPath?: string | null;
	password?: string | null;
	expiresAt?: number | null;
	scheduledAt?: number | null;
};

const makeCreatePayload = (urlOrOpts: string | CreatePayloadOpts, namespace: string | null = null, shortPath: string | null = null) => {
	const opts: CreatePayloadOpts = typeof urlOrOpts === 'string'
		? { destinationUrl: urlOrOpts, namespace, shortPath }
		: urlOrOpts;

	return {
		type: 'view_submission' as const,
		view: {
			callback_id: 'create_link',
			state: {
				values: {
					destination_url_block: { destination_url: { type: 'url_text_input', value: opts.destinationUrl } },
					namespace_block: { namespace: { type: 'plain_text_input', value: opts.namespace ?? null } },
					short_path_block: { short_path: { type: 'plain_text_input', value: opts.shortPath ?? null } },
					password_block: { password: { type: 'plain_text_input', value: opts.password ?? null } },
					expires_at_block: { expires_at: { type: 'datetimepicker', value: null, selected_date_time: opts.expiresAt ?? null } },
					scheduled_at_block: { scheduled_at: { type: 'datetimepicker', value: null, selected_date_time: opts.scheduledAt ?? null } },
				},
			},
		},
	};
};

const makeLookUpPayload = (linkId: string) => ({
	type: 'view_submission' as const,
	view: {
		callback_id: 'look_up_link',
		state: {
			values: {
				link_id_block: { link_id: { type: 'plain_text_input', value: linkId } },
			},
		},
	},
});

describe('handleSlackViewSubmissionAction', () => {
	let ctx: ExecutionContext;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(testDate);
		ctx = createExecutionContext();
	});

	describe('create_link', () => {
		it('should return update response on successful creation', async () => {
			const result = await handleSlackViewSubmissionAction({
				payload: makeCreatePayload('https://example.com', null, 'sl-create-test'),
				requestUrl: 'https://short.url',
				env,
				ctx,
			});

			expect(result).not.toBeNull();
			expect(result!.response_action).toBe('update');
			if (result!.response_action === 'update') {
				expect(result!.view.callback_id).toBe('create_link_result');
			}
		});

		it('should create link with namespace and shortPath', async () => {
			const result = await handleSlackViewSubmissionAction({
				payload: makeCreatePayload('https://example.com', 'brand', 'sl-ns-test'),
				requestUrl: 'https://short.url',
				env,
				ctx,
			});

			expect(result).not.toBeNull();
			expect(result!.response_action).toBe('update');
		});

		it('should create link with password', async () => {
			const result = await handleSlackViewSubmissionAction({
				payload: makeCreatePayload({
					destinationUrl: 'https://example.com',
					shortPath: 'sl-pw-test',
					password: 'secret123',
				}),
				requestUrl: 'https://short.url',
				env,
				ctx,
			});

			expect(result).not.toBeNull();
			expect(result!.response_action).toBe('update');
		});

		it('should return field error for scheduledAt in the past', async () => {
			const pastTimestamp = Math.floor(testDate.getTime() / 1000) - 3600; // 1 hour before testDate

			const result = await handleSlackViewSubmissionAction({
				payload: makeCreatePayload({
					destinationUrl: 'https://example.com',
					shortPath: 'sl-sched-past',
					scheduledAt: pastTimestamp,
				}),
				requestUrl: 'https://short.url',
				env,
				ctx,
			});

			expect(result).toEqual({
				response_action: 'errors',
				errors: { scheduled_at_block: expect.any(String) },
			});
		});

		it('should return field error when shortPath is already in use', async () => {
			const existingLink: LinkKVSchema = {
				id: 'sl-taken',
				destinationUrl: 'https://existing.com',
				namespace: null,
				createdAt: testDateISO,
				updatedAt: testDateISO,
				expiresAt: null,
				expirationTtl: null,
				redirectStatusCode: 302,
			};
			await dbCreateLink(env.D1, existingLink);

			const result = await handleSlackViewSubmissionAction({
				payload: makeCreatePayload('https://example.com', null, 'sl-taken'),
				requestUrl: 'https://short.url',
				env,
				ctx,
			});

			expect(result).toEqual({
				response_action: 'errors',
				errors: { short_path_block: expect.stringContaining('in use') },
			});
		});
	});

	describe('look_up_link', () => {
		it('should return update response with link details on success', async () => {
			const link: LinkKVSchema = {
				id: 'sl-lookup',
				destinationUrl: 'https://example.com',
				namespace: null,
				createdAt: testDateISO,
				updatedAt: testDateISO,
				expiresAt: null,
				expirationTtl: null,
				redirectStatusCode: 302,
			};
			await dbCreateLink(env.D1, link);

			const result = await handleSlackViewSubmissionAction({
				payload: makeLookUpPayload('sl-lookup'),
				requestUrl: 'https://short.url',
				env,
				ctx,
			});

			expect(result).not.toBeNull();
			expect(result!.response_action).toBe('update');
			if (result!.response_action === 'update') {
				expect(result!.view.callback_id).toBe('look_up_link_result');
			}
		});

		it('should return field error when link not found', async () => {
			const result = await handleSlackViewSubmissionAction({
				payload: makeLookUpPayload('nonexistent-link'),
				requestUrl: 'https://short.url',
				env,
				ctx,
			});

			expect(result).toEqual({
				response_action: 'errors',
				errors: { link_id_block: 'No link found with that ID' },
			});
		});
	});

	it('should return null for unknown callback_id', async () => {
		const result = await handleSlackViewSubmissionAction({
			payload: {
				type: 'view_submission',
				view: {
					callback_id: 'unknown',
					state: { values: {} },
				},
			},
			requestUrl: 'https://short.url',
			env,
			ctx,
		});

		expect(result).toBeNull();
	});
});
