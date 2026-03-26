import { LinkKVSchema } from '../types';

type UpdateLinkKVParams = {
	destinationUrl?: string | null;
	expirationTtl?: number | null;
	redirectStatusCode?: number | null;
	password?: string | null;
	scheduledAt?: string | null;
};

export const kvUpdateLink = async (
	kv: KVNamespace<string>,
	currentLink: LinkKVSchema,
	updates: UpdateLinkKVParams
) => {
	const now = Date.now();
	const updatedTtl = updates.expirationTtl ? updates.expirationTtl : currentLink.expirationTtl;
	const expiresAt = updatedTtl ? new Date(now + updatedTtl * 1000).toISOString() : null;

	const updatedLink: LinkKVSchema = {
		...currentLink,
		destinationUrl: updates.destinationUrl ?? currentLink.destinationUrl,
		expirationTtl: updatedTtl,
		expiresAt,
		updatedAt: new Date(now).toISOString(),
		redirectStatusCode: updates.redirectStatusCode ?? currentLink.redirectStatusCode,
		password: updates.password !== undefined ? updates.password : currentLink.password,
		scheduledAt: updates.scheduledAt !== undefined ? updates.scheduledAt : currentLink.scheduledAt,
	};

	await kv.put(currentLink.id, JSON.stringify(updatedLink), {
		expirationTtl: updatedTtl ?? undefined,
	});

	return updatedLink;
};
