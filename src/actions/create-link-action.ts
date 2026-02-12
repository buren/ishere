import { defaultMaxShortIdRetries, defaultShortPathLength, reservedPaths } from '../utils/constants';
import { LinkKVSchema, Action } from '../types';
import { CreateLinkRequestBody } from '../schema';
import { dbCreateLink } from '../db';
import { generateShortId } from '../utils/generate-short-id';
import { linkWithUrl, LinkWithUrls } from '../utils/link-with-url';
import { messages } from './constants';
import StatusError from '../errors/status-error';

const isUniqueConstraintError = (error: unknown): boolean =>
	error instanceof Error && error.message.includes('UNIQUE constraint failed');

const buildLink = (id: string, destinationUrl: string, namespace: string | null, expirationTtl: number | null): LinkKVSchema => {
	const now = Date.now();
	const createdAt = new Date(now).toISOString();
	return {
		id,
		destinationUrl,
		namespace: namespace ?? null,
		createdAt,
		updatedAt: createdAt,
		expiresAt: expirationTtl ? new Date(now + expirationTtl * 1000).toISOString() : null,
		expirationTtl: expirationTtl ?? null,
	};
};

export const createLinkAction: Action<CreateLinkRequestBody, LinkWithUrls> = async ({ data, url, env, ctx }) => {
	const { destinationUrl, shortPath, namespace = null, length: lengthArg, expirationTtl } = data;
	const length = lengthArg ?? (Number(env.DEFAULT_SHORT_PATH_LENGTH) || defaultShortPathLength);

	const withNamespace = (key: string) => [namespace, key].filter(Boolean).join('-');
	const isReserved = (id: string) => reservedPaths.includes(id.split('-')[0]);

	if (shortPath) {
		const id = withNamespace(shortPath);

		if (isReserved(id)) {
			throw new StatusError(400, messages.idIsReserved, 'id', 'reserved');
		}

		const link = buildLink(id, destinationUrl, namespace, expirationTtl ?? null);

		try {
			await dbCreateLink(env.D1, link);
		} catch (error) {
			if (isUniqueConstraintError(error)) {
				throw new StatusError(400, messages.idIsInUse, 'id', 'in_use');
			}
			throw error;
		}

		ctx.waitUntil(
			env.KV.put(id, JSON.stringify(link), { expirationTtl: expirationTtl ?? undefined })
		);

		return { data: linkWithUrl(url, link) };
	}

	// Random path — retry on collision
	const maxRetries = Number(env.MAX_SHORT_ID_RETRIES) || defaultMaxShortIdRetries;
	for (let i = 0; i < maxRetries; i++) {
		const id = withNamespace(generateShortId(length));

		if (isReserved(id)) continue;

		const link = buildLink(id, destinationUrl, namespace, expirationTtl ?? null);

		try {
			await dbCreateLink(env.D1, link);

			ctx.waitUntil(
				env.KV.put(id, JSON.stringify(link), { expirationTtl: expirationTtl ?? undefined })
			);

			return { data: linkWithUrl(url, link) };
		} catch (error) {
			if (isUniqueConstraintError(error)) continue;
			throw error;
		}
	}

	throw new StatusError(500, 'Failed to generate a unique short path after multiple attempts');
};
