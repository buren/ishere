import { dbGetLink } from '../db';
import { LinkKVSchema } from '../types';

export const getLinkWithD1Fallback = async (env: Env, id: string): Promise<LinkKVSchema | null> => {
	let value = await env.KV.get(id, { type: 'json' });

	// The link might not exist in the KV yet if it was just created
	// so we check the database as well
	if (value === null) {
		value = await dbGetLink(env.D1, { id: id });
	}

	if (value === null) {
		return null;
	}

	return value as LinkKVSchema;
};
