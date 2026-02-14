import { LinkKVSchema } from "../types";
import { defaultRedirectStatusCode } from "../utils/constants";

const CREATE_SQL = `
INSERT INTO links (id, destinationUrl, namespace, expirationTtl, createdAt, updatedAt, expiresAt, redirectStatusCode, password, scheduledAt)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

export const dbCreateLink = async (
	db: D1Database,
	{ id, destinationUrl, namespace, expirationTtl, createdAt, updatedAt, expiresAt, redirectStatusCode, password, scheduledAt }: LinkKVSchema
) => {
	await db
		.prepare(CREATE_SQL)
		.bind(id, destinationUrl, namespace ?? null, expirationTtl ?? null, createdAt, updatedAt, expiresAt ?? null, redirectStatusCode ?? defaultRedirectStatusCode, password ?? null, scheduledAt ?? null)
		.run();
};
