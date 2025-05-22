import { LinkDbSchema, LinkKVSchema } from '../types';

const GET_SQL = `
SELECT * FROM links WHERE id = ?
`;

export const dbGetLink = async (
	db: D1Database,
	{ id }: { id: string }
): Promise<LinkKVSchema | null> => {
	const stmt = db.prepare(GET_SQL);
	const result = (await stmt.bind(id).first()) as LinkDbSchema | null;

	if (!result) {
		return null;
	}

	return {
		...result,
		createdAt: result.createdAt,
		updatedAt: result.updatedAt
	};
};
