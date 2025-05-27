import { createExecutionContext, env, SELF, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { messages } from '../../../src/actions';
import { apiKeyHeader } from '../../../src/utils/constants';

describe('DELETE /api/link/:id', () => {
	const testDate = new Date('2024-07-26T10:00:00.000Z');
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
		env.KV.put(id, JSON.stringify({ destinationUrl: 'https://example.com' }));
		env.KV.delete = vi.fn();

		const response = await SELF.fetch(`https://example.com/api/link/${id}`, {
			method: 'DELETE',
			headers: { [apiKeyHeader]: apiKey },
		});

		expect(response.status).toBe(202);
		const data = await response.json() as any;
		expect(data.message).toBe(messages.deleteRequestReceived);
		expect(env.KV.delete).toHaveBeenCalledWith('test-link');
	});

	it('should return 404 if link does not exist', async () => {
		env.KV.delete = vi.fn();
		const response = await SELF.fetch('https://example.com/api/link/nonexistent-link', {
			method: 'DELETE',
			headers: { [apiKeyHeader]: apiKey },
		});

		expect(response.status).toBe(404);
		expect(env.KV.delete).not.toHaveBeenCalled();
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
