import { dbGetLink } from '../db';
import { kvGetLink } from '../kv';
import { LinkKVSchema } from '../types';

export const getLinkWithD1Fallback = async (
	env: Env,
	id: string,
	ctx?: { waitUntil(promise: Promise<unknown>): void }
): Promise<LinkKVSchema | null> => {
	const value = await kvGetLink(env.KV, id);
	if (value !== null) {
		return value;
	}

	// KV miss — try D1
	const dbValue = await dbGetLink(env.D1, { id });
	if (dbValue === null) {
		return null;
	}

	// Populate KV cache on D1 hit
	const putPromise = env.KV.put(id, JSON.stringify(dbValue), {
		expirationTtl: dbValue.expirationTtl ?? undefined,
	});
	if (ctx) {
		ctx.waitUntil(putPromise);
	} else {
		await putPromise;
	}

	return dbValue;
};
