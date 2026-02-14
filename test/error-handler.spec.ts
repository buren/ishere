import { SELF } from 'cloudflare:test';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as actions from '../src/actions';
import StatusError from '../src/errors/status-error';

describe('Centralized error handler', () => {
	const apiKey = 'notsosecret';

	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('should return 400 with error message for StatusError(400)', async () => {
		vi.spyOn(actions, 'getLinkAction').mockRejectedValueOnce(
			new StatusError(400, 'Invalid input')
		);

		const response = await SELF.fetch('https://example.com/api/link/test-id');

		expect(response.status).toBe(400);
		expect(await response.json()).toStrictEqual({
			error: { message: 'Invalid input' },
		});
	});

	it('should return 404 with "Not found" for StatusError(404)', async () => {
		vi.spyOn(actions, 'getLinkAction').mockRejectedValueOnce(
			new StatusError(404, 'Not found')
		);

		const response = await SELF.fetch('https://example.com/api/link/test-id');

		expect(response.status).toBe(404);
		expect(await response.json()).toStrictEqual({
			error: { message: 'Not found' },
		});
	});

	it('should return 400 with validation error format for StatusError with path/code', async () => {
		vi.spyOn(actions, 'getLinkAction').mockRejectedValueOnce(
			new StatusError(400, 'Must be a valid URL', 'destinationUrl', 'invalid_format')
		);

		const response = await SELF.fetch('https://example.com/api/link/test-id');

		expect(response.status).toBe(400);
		expect(await response.json()).toStrictEqual({
			error: {
				message: 'Must be a valid URL',
				errors: [
					{
						field: 'destinationUrl',
						code: 'invalid_format',
						message: 'Must be a valid URL',
					},
				],
			},
		});
	});

	it('should return 500 with "Internal server error" for plain Error', async () => {
		vi.spyOn(actions, 'getLinkAction').mockRejectedValueOnce(
			new Error('unexpected failure')
		);

		const response = await SELF.fetch('https://example.com/api/link/test-id');

		expect(response.status).toBe(500);
		expect(await response.json()).toStrictEqual({
			error: { message: 'Internal server error' },
		});
	});

	it('should return 503 with "Service unavailable" via health route', async () => {
		vi.spyOn(actions, 'healthCheckAction').mockRejectedValueOnce(
			new StatusError(503, 'Service unavailable')
		);

		const response = await SELF.fetch('https://example.com/api/health');

		expect(response.status).toBe(503);
		expect(await response.json()).toStrictEqual({
			error: { message: 'Service unavailable' },
		});
	});
});
