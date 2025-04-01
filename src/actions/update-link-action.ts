import StatusError from '../errors/status-error';
import { isValidUrl } from '../utils/is-valid-url';
import { messages } from './constants';
import { Action, LinkKVSchema, UpdateLinkRequestBody } from '../types';
import { linkWithUrl } from '../utils/link-with-url';

export const updateLinkAction: Action<UpdateLinkRequestBody & { id: string }> = async ({ data, url, env }) => {
	const { id, destinationUrl, expirationTtl } = data;

	const currentLink = await env.KV.get(id, { type: 'json' });
	if (!currentLink) {
		throw new StatusError(404, messages.notFound);
	}

	if (!isValidUrl(destinationUrl)) {
		console.log(`Invalid destination url: ${destinationUrl}`);
		throw new StatusError(400, messages.invalidDestinationUrl);
	}

	if (expirationTtl && expirationTtl < 60) {
		throw new StatusError(400, messages.invalidExpirationTtl);
	}

	// Write to KV
	const { createdAt, namespace } = currentLink as LinkKVSchema;
	const updatedAt = new Date(Date.now()).toISOString();
	const link: LinkKVSchema = { id, destinationUrl, namespace, createdAt, updatedAt };
	await env.KV.put(id, JSON.stringify(link), { expirationTtl });

	return {
		status: 202,
		data: linkWithUrl(url, link),
	};
};

