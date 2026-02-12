import { createExecutionContext, env, SELF, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { messages } from '../../../src/actions';
import { apiKeyHeader } from '../../../src/utils/constants';
import { dbCreateLink, dbGetLink } from '../../../src/db';

describe('DELETE /api/link/:id', () => {
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

	it('should delete a link successfully', async () => {
		const id = 'test-link';
		const link = {
			id,
			destinationUrl: 'https://example.com',
			namespace: null,
			expirationTtl: null,
			createdAt: testDateISO,
			updatedAt: testDateISO,
			expiresAt: null,
		};
		await dbCreateLink(env.D1, link);
		await env.KV.put(id, JSON.stringify(link));

		const response = await SELF.fetch(`https://example.com/api/link/${id}`, {
			method: 'DELETE',
			headers: { [apiKeyHeader]: apiKey },
		});

		expect(response.status).toBe(202);
		const data = await response.json() as any;
		expect(data.message).toBe(messages.deleted);

		// Verify D1 row is deleted
		const dbLink = await dbGetLink(env.D1, { id });
		expect(dbLink).toBeNull();
	});

	it('should return 404 if link does not exist', async () => {
		const response = await SELF.fetch('https://example.com/api/link/nonexistent-link', {
			method: 'DELETE',
			headers: { [apiKeyHeader]: apiKey },
		});

		expect(response.status).toBe(404);
	});

	it('should reject request without API key', async () => {
		const response = await SELF.fetch('https://example.com/api/link/test-link', {
			method: 'DELETE',
		});

		expect(response.status).toBe(401);
	});

	it('should reject request with invalid API key', async () => {
		const response = await SELF.fetch('https://example.com/api/link/test-link', {
			method: 'DELETE',
			headers: { [apiKeyHeader]: 'invalid-key' },
		});

		expect(response.status).toBe(403);
	});
});
