import { createExecutionContext, env, SELF, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as actions  from '../../../src/actions';
import { LinkResponseSchema } from '../../../src/schema';
import { z } from 'zod';
import { linkWithUrl } from '../../../src/utils/link-with-url';
import StatusError from '../../../src/errors/status-error';

type ResponseBody = z.infer<typeof LinkResponseSchema>;

describe('POST /api/health', () => {
	const testDate = new Date('2024-07-26T10:00:00.000Z');
	const testDateISO = testDate.toISOString();
	const apiKey = 'notsosecret';
	let ctx: ExecutionContext;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(testDate);
		ctx = createExecutionContext();
		vi.resetAllMocks();
	});

	it('should return health link', async () => {
		const url = 'https://example.com/api/health';
		const response = await SELF.fetch(url, {
			method: 'GET',
		});

		const data = await response.json() as ResponseBody;

		expect(data).toStrictEqual(
			linkWithUrl(url, {
				id: 'health',
				destinationUrl: 'https://example.com',
				createdAt: testDateISO,
				updatedAt: testDateISO,
				expiresAt: null,
				namespace: null,
				expirationTtl: null,
				redirectStatusCode: 302,
				scheduledAt: null,
			})
		);

		expect(response.status).toBe(200);
	});

	it('should return 503 if service unavailable', async () => {
		vi.spyOn(actions, 'healthCheckAction').mockRejectedValueOnce(new StatusError(503, 'Service unavailable'));

		const url = 'https://example.com/api/health';
		const response = await SELF.fetch(url, {
			method: 'GET',
		});

		const data = (await response.json());

		expect(data).toStrictEqual({
			error: {
				message: 'Service unavailable',
			},
		});

		expect(response.status).toBe(503);
	});
});
