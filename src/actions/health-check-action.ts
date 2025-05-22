import { HEALTH_KEY } from '../utils/constants';
import { Action, LinkKVSchema } from '../types';
import { linkWithUrl, LinkWithUrls } from '../utils/link-with-url';
import { messages } from './constants';
import StatusError from '../errors/status-error';
import { kvCreateLink, kvGetLink } from '../kv';

export const healthCheckAction: Action<{}, LinkWithUrls> = async ({ url, env }) => {
	try {
		const id = HEALTH_KEY;
		await kvCreateLink(env.KV, {
			id,
			destinationUrl: 'https://example.com',
		});

		const value = await kvGetLink(env.KV, id);

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
