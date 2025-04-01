export const dbDeleteOldLinks = async (db: D1Database, { seconds }: { seconds: number }): Promise<number> => {
	const cutoffTime = Date.now() - seconds * 1000;
	const isoCutoffTime = new Date(cutoffTime).toISOString().slice(0, 19).replace('T', ' ');

	const statement = db.prepare('DELETE FROM links WHERE createdAt <= ?');
	const result = await statement.bind(isoCutoffTime).run();

	return result.meta.changes;
};
