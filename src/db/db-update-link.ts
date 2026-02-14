import { LinkKVSchema } from '../types';

const UPDATE_SQL = `
UPDATE links SET destinationUrl = ?, expirationTtl = ?, expiresAt = ?, updatedAt = ?, redirectStatusCode = ?, password = ?, scheduledAt = ? WHERE id = ?
`;

export const dbUpdateLink = async (
	db: D1Database,
	{ id, destinationUrl, expirationTtl, expiresAt, updatedAt, redirectStatusCode, password, scheduledAt }: LinkKVSchema
) => {
	await db
		.prepare(UPDATE_SQL)
		.bind(destinationUrl, expirationTtl ?? null, expiresAt ?? null, updatedAt, redirectStatusCode, password ?? null, scheduledAt ?? null, id)
		.run();
};
