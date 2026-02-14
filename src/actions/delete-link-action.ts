import StatusError from '../errors/status-error';
import { messages } from './constants';
import { Action } from '../types';
import { getLinkWithD1Fallback } from '../utils/get-link-with-d1-fallback';
import { linkWithUrl } from '../utils/link-with-url';
import { notifySlackLinkChange } from './notify-slack-action';
import { notifyWebhook } from '../utils/webhook';
import { dbDeleteLink } from '../db';

export const deleteLinkAction: Action<{ id: string }, { message: string }> = async ({ data, url, env, ctx }) => {
	const { id } = data;

	const currentLink = await getLinkWithD1Fallback(env, id, ctx);
	if (!currentLink) {
		throw new StatusError(404, messages.notFound);
	}

	await dbDeleteLink(env.D1, id);

	const result = linkWithUrl(url, currentLink);
	ctx.waitUntil(env.KV.delete(id));
	ctx.waitUntil(notifySlackLinkChange({ action: 'deleted', linkId: id, shortUrl: result.url, destinationUrl: currentLink.destinationUrl, env }));
	ctx.waitUntil(notifyWebhook({ event: 'link.deleted', link: result, env }));

	return { data: { message: messages.deleted } };
};
