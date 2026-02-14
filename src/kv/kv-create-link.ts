import { LinkKVSchema } from '../types';
import { defaultRedirectStatusCode } from '../utils/constants';

type CreateLinkKVSchema = Omit<LinkKVSchema, 'createdAt' | 'updatedAt' | 'expiresAt'>;

export const kvCreateLink = async (
	kv: KVNamespace<string>,
	{ id, destinationUrl, namespace, expirationTtl, redirectStatusCode }: CreateLinkKVSchema
): Promise<LinkKVSchema> => {
	const now = Date.now();
	const createdAt = new Date(now).toISOString();
	const link: LinkKVSchema = {
		id,
		destinationUrl,
		namespace: namespace ?? null,
		createdAt,
		updatedAt: createdAt,
		expiresAt: expirationTtl ? new Date(now + expirationTtl * 1000).toISOString() : null,
		expirationTtl: expirationTtl ?? null,
		redirectStatusCode: redirectStatusCode ?? defaultRedirectStatusCode,
	};
	await kv.put(id, JSON.stringify(link), { expirationTtl: expirationTtl ?? undefined });
	return link;
};
