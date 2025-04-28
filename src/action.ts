import { dbCreateLink } from './db';
import { generateShortId } from './utils/generate-short-id';

export const action = async (env: Env, ctx: ExecutionContext, a: number) => {
	const id = generateShortId(8);
	console.log('Generated id:', id);

	ctx.waitUntil(dbCreateLink(env.D1, { id: "asdasdasd", destinationUrl: "https://example.com", namespace: null }));

	return `${id}-${73 + a}`;
};
