export const dbDeleteOldLinks = async (db: D1Database): Promise<number> => {
	const now = new Date().toISOString();

	const statement = db.prepare('DELETE FROM links WHERE expiresAt IS NOT NULL AND expiresAt <= ?');
	const result = await statement.bind(now).run();

	return result.meta.changes;
};
