type DbLinkSchema = { id: string; destinationUrl: string; namespace?: string | null };

export const dbCreateLink = async (db: D1Database, { id, destinationUrl, namespace }: DbLinkSchema) => {
	await db.prepare(
		`
		INSERT INTO links (id, destinationUrl, namespace)
		VALUES (?, ?, ?)
		`
	)
		.bind(id, destinationUrl, namespace)
		.run();
};
