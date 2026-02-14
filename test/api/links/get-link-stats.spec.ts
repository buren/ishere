import { env, SELF } from 'cloudflare:test';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dbCreateLink } from '../../../src/db';
import * as actions from '../../../src/actions';
import StatusError from '../../../src/errors/status-error';

describe('GET /api/link/:id/stats/:groupBy', () => {
	const testDate = new Date('2024-07-26T10:00:00.000Z');
	const testDateISO = testDate.toISOString();
	const apiKey = 'notsosecret';

	const makeUrl = (id: string, groupBy: string) =>
		`https://example.com/api/link/${id}/stats/${groupBy}`;

	const authHeaders = { Authorization: `Bearer ${apiKey}` };

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(testDate);
		vi.restoreAllMocks();
	});

	it('should return stats for a valid link', async () => {
		const statsData = {
			totalRows: 2,
			totalRedirects: 10,
			botRedirects: 3,
			nonBotRedirects: 7,
			data: [
				{ id: 'test-link', datetime: '2024-07-26T00:00:00', totalRedirects: 10, botRedirects: 3, nonBotRedirects: 7 },
			],
		};

		vi.spyOn(actions, 'getLinkStatsAction').mockResolvedValueOnce({ data: statsData });

		const response = await SELF.fetch(makeUrl('test-link', 'day'), {
			headers: authHeaders,
		});

		expect(response.status).toBe(200);
		expect(await response.json()).toStrictEqual(statsData);
	});

	it('should return 401 without API key', async () => {
		const response = await SELF.fetch(makeUrl('test-link', 'day'));

		expect(response.status).toBe(401);
		expect(await response.json()).toStrictEqual({
			error: { message: 'Invalid authorization. Use Authorization: Bearer <token>' },
		});
	});

	it('should return 403 with invalid API key', async () => {
		const response = await SELF.fetch(makeUrl('test-link', 'day'), {
			headers: { Authorization: 'Bearer wrong-key' },
		});

		expect(response.status).toBe(403);
		expect(await response.json()).toStrictEqual({
			error: { message: 'Invalid API key. Use Authorization: Bearer <token>' },
		});
	});

	it('should return 404 if link does not exist', async () => {
		vi.spyOn(actions, 'getLinkStatsAction').mockRejectedValueOnce(
			new StatusError(404, 'Not found.')
		);

		const response = await SELF.fetch(makeUrl('nonexistent', 'day'), {
			headers: authHeaders,
		});

		expect(response.status).toBe(404);
		expect(await response.json()).toStrictEqual({
			error: { message: 'Not found' },
		});
	});

	it('should return 503 when analytics is not configured', async () => {
		const id = 'stats-test';
		await dbCreateLink(env.D1, {
			id,
			destinationUrl: 'https://example.com',
			namespace: null,
			expirationTtl: null,
			createdAt: testDateISO,
			updatedAt: testDateISO,
			expiresAt: null,
		});
		await env.KV.put(id, JSON.stringify({ id, destinationUrl: 'https://example.com' }));

		const response = await SELF.fetch(makeUrl(id, 'day'), {
			headers: authHeaders,
		});

		expect(response.status).toBe(503);
		expect(await response.json()).toStrictEqual({
			error: { message: 'Analytics is not configured. Set ACCOUNT_ID and ANALYTICS_API_TOKEN to enable.' },
		});
	});

	it('should return 500 on unexpected error', async () => {
		vi.spyOn(actions, 'getLinkStatsAction').mockRejectedValueOnce(
			new Error('unexpected')
		);

		const response = await SELF.fetch(makeUrl('test-link', 'day'), {
			headers: authHeaders,
		});

		expect(response.status).toBe(500);
		expect(await response.json()).toStrictEqual({
			error: { message: 'Internal server error' },
		});
	});
});
