import { LinkKVSchema } from '../types';

const UPDATE_SQL = `
UPDATE links SET destinationUrl = ?, expirationTtl = ?, expiresAt = ?, updatedAt = ? WHERE id = ?
`;

export const dbUpdateLink = async (
	db: D1Database,
	{ id, destinationUrl, expirationTtl, expiresAt, updatedAt }: LinkKVSchema
) => {
	await db
		.prepare(UPDATE_SQL)
		.bind(destinationUrl, expirationTtl ?? null, expiresAt ?? null, updatedAt, id)
		.run();
};
