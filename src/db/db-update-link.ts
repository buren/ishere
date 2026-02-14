import { LinkKVSchema } from '../types';

const UPDATE_SQL = `
UPDATE links SET destinationUrl = ?, expirationTtl = ?, expiresAt = ?, updatedAt = ?, redirectStatusCode = ? WHERE id = ?
`;

export const dbUpdateLink = async (
	db: D1Database,
	{ id, destinationUrl, expirationTtl, expiresAt, updatedAt, redirectStatusCode }: LinkKVSchema
) => {
	await db
		.prepare(UPDATE_SQL)
		.bind(destinationUrl, expirationTtl ?? null, expiresAt ?? null, updatedAt, redirectStatusCode, id)
		.run();
};
