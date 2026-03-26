import { Context } from 'hono';
import { getLinkWithD1Fallback } from '../../utils/get-link-with-d1-fallback';
import { notFoundHtml, linkPreviewHtml, passwordPromptHtml, scheduledNotActiveHtml } from '../../html';
import { linkWithUrl } from '../../utils/link-with-url';
import qrResponse from '../../utils/qr-response';
import { notFoundQrResponse } from '../../utils/not-found-qr-response';
import trackLinkRedirect from '../../analytics/track-link-redirect';
import { defaultRedirectStatusCode } from '../../utils/constants';
import { verifyPassword } from '../../utils/hash-password';

type AppContext = Context<{ Bindings: Env }>;

export const handleQrRequest = async (c: AppContext, id: string) => {
	const value = await getLinkWithD1Fallback(c.env, id);
	const { format } = c.req.query();

	if (value === null) {
		const { contentType, body } = notFoundQrResponse(format);
		c.header('Content-Type', contentType);
		c.status(404);
		return c.body(body);
	}

	const { url } = linkWithUrl(c.req.url, value);
	const { contentType, body } = await qrResponse(url, c.req.query());
	c.header('Content-Type', contentType);
	return c.body(body);
};

export const handleInfoRequest = async (c: AppContext, id: string) => {
	const value = await getLinkWithD1Fallback(c.env, id);

	if (value === null) {
		c.status(404);
		return c.html(notFoundHtml);
	}

	const link = linkWithUrl(c.req.url, value);
	return c.html(linkPreviewHtml(link));
};

export const handleRedirectRequest = async (c: AppContext, id: string, displayPath: string) => {
	const value = await getLinkWithD1Fallback(c.env, id);

	if (value === null) {
		c.status(404);
		return c.render(notFoundHtml);
	}

	if (value.scheduledAt && new Date(value.scheduledAt) > new Date()) {
		return c.html(scheduledNotActiveHtml(value.scheduledAt));
	}

	if (value.password) {
		return c.html(passwordPromptHtml(displayPath));
	}

	c.executionCtx.waitUntil(trackLinkRedirect(id, c.req.raw, c.env));
	return c.redirect(value.destinationUrl, value.redirectStatusCode ?? defaultRedirectStatusCode);
};

export const handlePasswordSubmit = async (c: AppContext, id: string, displayPath: string) => {
	const value = await getLinkWithD1Fallback(c.env, id);

	if (value === null) {
		c.status(404);
		return c.render(notFoundHtml);
	}

	if (!value.password) {
		if (value.scheduledAt && new Date(value.scheduledAt) > new Date()) {
			return c.html(scheduledNotActiveHtml(value.scheduledAt));
		}
		c.executionCtx.waitUntil(trackLinkRedirect(id, c.req.raw, c.env));
		return c.redirect(value.destinationUrl, value.redirectStatusCode ?? defaultRedirectStatusCode);
	}

	const body = await c.req.parseBody();
	const password = body['password'];

	if (typeof password !== 'string' || !(await verifyPassword(password, value.password))) {
		return c.html(passwordPromptHtml(displayPath, 'Incorrect password.'));
	}

	if (value.scheduledAt && new Date(value.scheduledAt) > new Date()) {
		return c.html(scheduledNotActiveHtml(value.scheduledAt));
	}

	c.executionCtx.waitUntil(trackLinkRedirect(id, c.req.raw, c.env));
	return c.redirect(value.destinationUrl, value.redirectStatusCode ?? defaultRedirectStatusCode);
};
