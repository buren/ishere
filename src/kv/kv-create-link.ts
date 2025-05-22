import { LinkKVSchema } from '../types';

type CreateLinkKVSchema = Omit<LinkKVSchema, 'createdAt' | 'updatedAt'>;

export const kvCreateLink = async (kv: KVNamespace<string>, { id, destinationUrl, namespace, expirationTtl }: CreateLinkKVSchema) => {
	const createdAt = new Date(Date.now()).toISOString();
	const link: LinkKVSchema = {
		id,
		destinationUrl,
		createdAt,
		updatedAt: createdAt,
		namespace: namespace ?? null,
		expirationTtl: expirationTtl ?? null,
	};
	await kv.put(id, JSON.stringify(link), { expirationTtl: expirationTtl ?? undefined });
	return link;
};
