import { LinkDbSchema, LinkKVSchema, PartialBy } from "../types";

const CREATE_SQL = `
INSERT INTO links (id, destinationUrl, namespace, expirationTtl, createdAt, updatedAt)
VALUES (?, ?, ?, ?, ?, ?)
`;

export const dbCreateLink = async (
	db: D1Database,
	{ id, destinationUrl, namespace, expirationTtl, createdAt, updatedAt }: LinkKVSchema
) => {
	await db
		.prepare(CREATE_SQL)
		.bind(id, destinationUrl, namespace ?? null, expirationTtl ?? null, createdAt, updatedAt)
		.run();
};
