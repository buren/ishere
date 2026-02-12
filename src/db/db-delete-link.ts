const DELETE_SQL = `
DELETE FROM links WHERE id = ?
`;

export const dbDeleteLink = async (db: D1Database, id: string) => {
	await db.prepare(DELETE_SQL).bind(id).run();
};
