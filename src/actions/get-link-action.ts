import StatusError from '../errors/status-error';
import { getLinkWithD1Fallback } from '../utils/get-link-with-d1-fallback';
import { linkWithUrl } from '../utils/link-with-url';
import { messages } from './constants';
import { Action } from '../types';

export const getLinkAction: Action = async ({ data, url, env }) => {
	const value = await getLinkWithD1Fallback(env, data.id);

	if (value === null) {
		throw new StatusError(404, messages.notFound);
	}

	return {
		status: 200,
		data: linkWithUrl(url, value),
	}
};
