import { reservedPaths } from '../utils/constants';
import { LinkKVSchema, Action } from '../types';
import { CreateLinkRequestBody } from '../schema';
import { dbCreateLink } from '../db';
import { generateShortId } from '../utils/generate-short-id';
import { linkWithUrl, LinkWithUrls } from '../utils/link-with-url';
import { messages } from './constants';
import StatusError from '../errors/status-error';

export const createLinkAction: Action<CreateLinkRequestBody, LinkWithUrls> = async ({ data, url, env, ctx }) => {
	const { destinationUrl, shortPath, namespace = null, length, expirationTtl } = data;

	const withNamespace = (key: string) => [namespace, key].filter(Boolean).join('-');
	const validateIdNotReserved = (id: string) => reservedPaths.includes(id.split('-')[0]);

	// Generate/validate shortPath key
	let id;
	if (!shortPath) {
		console.log('No shortPath given - generating');

		id = withNamespace(generateShortId(length));
		let value = await env.KV.get(id, { type: 'json' });
		while (value !== null || validateIdNotReserved(id || '')) {
			id = withNamespace(generateShortId(length));
			value = await env.KV.get(id, { type: 'json' });
		}
	} else {
		console.log('shortPath given');
		id = withNamespace(shortPath);

		console.log('Checking for conflicts');
		if (validateIdNotReserved(id)) {
			throw new StatusError(400, messages.idIsReserved, 'id');
		}

		const value = await env.KV.get(id, { type: 'json' });
		if (value !== null) {
			throw new StatusError(400, messages.idIsInUse, 'id');
		}
	}

	// Write to KV
	const createdAt = new Date(Date.now()).toISOString();
	const link: LinkKVSchema = {
		destinationUrl,
		id,
		namespace,
		createdAt,
		updatedAt:
		createdAt,
		expirationTtl: expirationTtl ?? null
	};
	await env.KV.put(id, JSON.stringify(link), { expirationTtl });

	ctx.waitUntil(dbCreateLink(env.D1, { id, destinationUrl, namespace }));
	return {
		data: linkWithUrl(url, link),
		waitFor: [],
	};
};
