import StatusError from '../errors/status-error';
import { messages } from './constants';
import { Action } from '../types';

export const deleteLinkAction: Action = async ({ data, env }) => {
	const { id } = data;

	const currentLink = await env.KV.get(id, { type: 'json' });
	if (!currentLink) {
		throw new StatusError(404, messages.notFound);
	}

	// Delete from KV
	await env.KV.delete(id);

	return { data: { message: messages.deleteRequestReceived, } };
};
