import { LinkKVSchema } from "../types";

export const kvGetLink = async (kv: KVNamespace<string>, id: string): Promise<LinkKVSchema | null> =>
	await kv.get<LinkKVSchema>(id, { type: 'json' });
