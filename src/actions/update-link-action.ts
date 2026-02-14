import StatusError from '../errors/status-error';
import { messages } from './constants';
import { Action } from '../types';
import { UpdateLinkRequestBodySchema } from '../schema';
import { linkWithUrl } from '../utils/link-with-url';
import { getLinkWithD1Fallback } from '../utils/get-link-with-d1-fallback';
import { notifySlackLinkChange } from './notify-slack-action';
import { dbUpdateLink } from '../db';
import { hashPassword } from '../utils/hash-password';

export const updateLinkAction: Action<UpdateLinkRequestBodySchema & { id: string }> = async ({ data, url, env, ctx }) => {
	const { id, destinationUrl, expirationTtl, redirectStatusCode, password } = data;

	const currentLink = await getLinkWithD1Fallback(env, id, ctx);
	if (!currentLink) {
		throw new StatusError(404, messages.notFound);
	}

	if (expirationTtl && expirationTtl < 60) {
		throw new StatusError(400, messages.invalidExpirationTtl, 'expirationTtl', 'too_low');
	}

	const now = Date.now();
	const updatedTtl = expirationTtl ? expirationTtl : currentLink.expirationTtl;
	const expiresAt = updatedTtl ? new Date(now + updatedTtl * 1000).toISOString() : null;

	let updatedPassword: string | null | undefined;
	if (typeof password === 'string') {
		updatedPassword = await hashPassword(password);
	} else if (password === null) {
		updatedPassword = null;
	} else {
		updatedPassword = currentLink.password;
	}

	const updatedLink = {
		...currentLink,
		destinationUrl: destinationUrl ?? currentLink.destinationUrl,
		expirationTtl: updatedTtl,
		expiresAt,
		updatedAt: new Date(now).toISOString(),
		redirectStatusCode: redirectStatusCode ?? currentLink.redirectStatusCode,
		password: updatedPassword,
	};

	await dbUpdateLink(env.D1, updatedLink);

	ctx.waitUntil(
		env.KV.put(id, JSON.stringify(updatedLink), {
			expirationTtl: updatedTtl ?? undefined,
		})
	);

	const result = linkWithUrl(url, updatedLink);
	ctx.waitUntil(notifySlackLinkChange({ action: 'updated', linkId: updatedLink.id, shortUrl: result.url, destinationUrl: updatedLink.destinationUrl, env }));

	return {
		status: 202,
		data: result,
	};
};
