export const dbCreateLink = async (
	db: D1Database,
	{ id, destinationUrl }: { id: string; destinationUrl: string }
) => {
	const statement = db.prepare('INSERT INTO links (id, destinationUrl) VALUES (?, ?)');
	await statement.bind(id, destinationUrl).run();
};
