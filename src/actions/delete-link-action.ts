import StatusError from '../errors/status-error';
import { messages } from './constants';
import { Action } from '../types';
import { getLinkWithD1Fallback } from '../utils/get-link-with-d1-fallback';
import { dbDeleteLink } from '../db';

export const deleteLinkAction: Action = async ({ data, env, ctx }) => {
	const { id } = data;

	const currentLink = await getLinkWithD1Fallback(env, id, ctx);
	if (!currentLink) {
		throw new StatusError(404, messages.notFound);
	}

	await dbDeleteLink(env.D1, id);

	ctx.waitUntil(env.KV.delete(id));

	return { data: { message: messages.deleted } };
};
