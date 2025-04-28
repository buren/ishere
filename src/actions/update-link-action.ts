import StatusError from '../errors/status-error';
import { messages } from './constants';
import { Action, LinkKVSchema } from '../types';
import { UpdateLinkRequestBodySchema } from '../schema';
import { linkWithUrl } from '../utils/link-with-url';

export const updateLinkAction: Action<UpdateLinkRequestBodySchema & { id: string }> = async ({ data, url, env }) => {
	const { id, destinationUrl, expirationTtl } = data;

	const currentLink = await env.KV.get(id, { type: 'json' });
	if (!currentLink) {
		throw new StatusError(404, messages.notFound);
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
