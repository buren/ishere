import { LinkKVSchema } from "../types";

export const kvGetLink = async (kv: KVNamespace<string>, id: string): Promise<LinkKVSchema> =>
	await kv.get(id, { type: 'json' }) as LinkKVSchema;
