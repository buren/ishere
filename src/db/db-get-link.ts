import { LinkDbSchema, LinkKVSchema } from '../types';

export const dbGetLink = async (db: D1Database, { id }: { id: string }): Promise<LinkKVSchema | null> => {
	const stmt = db.prepare('SELECT destinationUrl FROM links WHERE id = ?');
	const result = await stmt.bind(id).first();

	if (!result) {
		return null;
	}

	const { destinationUrl, namespace, createdAt, updatedAt } = result as LinkDbSchema;

	return {
		id,
		destinationUrl,
		namespace,
		createdAt,
		updatedAt,
	};
};
