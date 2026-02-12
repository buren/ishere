import { LinkDbSchema, LinkKVSchema } from '../types';

const GET_BY_NAMESPACE_SQL = `
SELECT * FROM links WHERE namespace = ? LIMIT ? OFFSET ?
`;

const COUNT_BY_NAMESPACE_SQL = `
SELECT COUNT(*) as total FROM links WHERE namespace = ?
`;

export const dbGetLinksByNamespace = async (
	db: D1Database,
	{ namespace, limit, offset }: { namespace: string; limit: number; offset: number }
): Promise<{ links: LinkKVSchema[]; total: number }> => {
	const [{ results }, countResult] = await db.batch([
		db.prepare(GET_BY_NAMESPACE_SQL).bind(namespace, limit, offset),
		db.prepare(COUNT_BY_NAMESPACE_SQL).bind(namespace),
	]);

	const links = (results as LinkDbSchema[]).map((result) => ({
		...result,
		createdAt: result.createdAt,
		updatedAt: result.updatedAt,
	}));

	const total = (countResult.results[0] as { total: number }).total;

	return { links, total };
};
