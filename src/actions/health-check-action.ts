import { HEALTH_KEY } from '../utils/constants';
import { Action, LinkKVSchema } from '../types';
import { linkWithUrl, LinkWithUrls } from '../utils/link-with-url';
import { messages } from './constants';
import StatusError from '../errors/status-error';

export const healthCheckAction: Action<{}, LinkWithUrls> = async ({ url, env }) => {
	try {
		const id = HEALTH_KEY;
		// Write to KV
		const createdAt = new Date(Date.now()).toISOString();
		const link: LinkKVSchema = { destinationUrl: 'https://washere.io', id, createdAt, updatedAt: createdAt };
		await env.KV.put(id, JSON.stringify(link));

		// Get KV
		const value = await env.KV.get(id, { type: 'json' });

		if (!value) {
			throw new StatusError(503, messages.serviceUnavailable);
		}

		const kvLink = value as LinkKVSchema;
		return { data: linkWithUrl(url, kvLink) };
	} catch (error) {
		console.log('Health check failed');
		throw new StatusError(503, messages.serviceUnavailable);
	}
};
