import StatusError from '../errors/status-error';
import { messages } from './constants';
import { Action, LinkKVSchema } from '../types';
import { UpdateLinkRequestBodySchema } from '../schema';
import { linkWithUrl } from '../utils/link-with-url';
import { kvGetLink } from '../kv';
import { kvUpdateLink } from '../kv/kv-update-link';

export const updateLinkAction: Action<UpdateLinkRequestBodySchema & { id: string }> = async ({ data, url, env }) => {
	const { id, destinationUrl, expirationTtl } = data;

	const currentLink = await kvGetLink(env.KV, id);
	if (!currentLink) {
		throw new StatusError(404, messages.notFound);
	}

	if (expirationTtl && expirationTtl < 60) {
		throw new StatusError(400, messages.invalidExpirationTtl);
	}

	const updatedLink = await kvUpdateLink(env.KV, currentLink, { destinationUrl, expirationTtl });

	return {
		status: 202,
		data: linkWithUrl(url, updatedLink),
	};
};
