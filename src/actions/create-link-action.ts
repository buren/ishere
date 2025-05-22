import { defaultShortPathLength, reservedPaths } from '../utils/constants';
import { LinkKVSchema, Action } from '../types';
import { CreateLinkRequestBody } from '../schema';
import { dbCreateLink } from '../db';
import { generateShortId } from '../utils/generate-short-id';
import { linkWithUrl, LinkWithUrls } from '../utils/link-with-url';
import { messages } from './constants';
import StatusError from '../errors/status-error';
import { kvCreateLink } from '../kv/kv-create-link';
import { kvGetLink } from '../kv';

export const createLinkAction: Action<CreateLinkRequestBody, LinkWithUrls> = async ({ data, url, env, ctx }) => {
	const { destinationUrl, shortPath, namespace = null, length: lengthArg, expirationTtl } = data;
	const length = lengthArg ?? defaultShortPathLength;

	const withNamespace = (key: string) => [namespace, key].filter(Boolean).join('-');
	const validateIdNotReserved = (id: string) => reservedPaths.includes(id.split('-')[0]);

	// Generate/validate shortPath key
	let id;
	if (!shortPath) {
		console.log('No shortPath given - generating');

		id = withNamespace(generateShortId(length));
		let value = await kvGetLink(env.KV, id);
		while (value !== null || validateIdNotReserved(id || '')) {
			id = withNamespace(generateShortId(length));
			value = await kvGetLink(env.KV, id);
		}
	} else {
		console.log('shortPath given');
		id = withNamespace(shortPath);

		console.log('Checking for conflicts');
		if (validateIdNotReserved(id)) {
			throw new StatusError(400, messages.idIsReserved, 'id');
		}

		const value = await kvGetLink(env.KV, id);
		if (value !== null) {
			throw new StatusError(400, messages.idIsInUse, 'id');
		}
	}

	const linkData = { id, destinationUrl, namespace, expirationTtl, };
	const link = await kvCreateLink(env.KV, linkData);
	ctx.waitUntil(dbCreateLink(env.D1, link));

	return { data: linkWithUrl(url, link), };
};
