import { z } from 'zod';
import { LinkKVSchema } from '../types';
import { UpdateLinkRequestSchema } from '../schema';

type UpdateLinkKVSchema = z.infer<typeof UpdateLinkRequestSchema>;

export const kvUpdateLink = async (
	kv: KVNamespace<string>,
	currentLink: LinkKVSchema,
	{ destinationUrl, expirationTtl }: UpdateLinkKVSchema
) => {
	const now = Date.now();
	const updatedTtl = expirationTtl ? expirationTtl : currentLink.expirationTtl;
	const expiresAt = updatedTtl ? new Date(now + updatedTtl * 1000).toISOString() : null;

	const updatedLink = {
		...currentLink,
		destinationUrl: destinationUrl ?? currentLink.destinationUrl,
		expirationTtl: updatedTtl,
		expiresAt,
		updatedAt: new Date(now).toISOString(),
	};
	await kv.put(currentLink.id, JSON.stringify(updatedLink), {
		expirationTtl: updatedTtl ?? undefined,
	});
	return updatedLink;
};
