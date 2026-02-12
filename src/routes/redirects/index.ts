import { getLinkWithD1Fallback } from '../../utils/get-link-with-d1-fallback';
import { LinkKVSchema } from '../../types';
import { LinkQrRequestOptionsSchema, LinkWithNamespaceRequestParamsSchema, LinkWithNRequestParamsSchema } from '../../schema';
import { notFoundHtml } from '../../html';
import { createRoute, z } from '@hono/zod-openapi';
import { Context } from 'hono';
import { linkWithUrl } from '../../utils/link-with-url';
import qrResponse from '../../utils/qr-response';
import { notFoundQrResponse } from '../../utils/not-found-qr-response';
import trackLinkRedirect from '../../analytics/track-link-redirect';
import { reservedPaths } from '../../utils/constants';
import { createApp } from '../app';

// Link shortening routes
const app = createApp();

// Short-circuit reserved paths to avoid unnecessary KV/D1 lookups
app.use('/:first{.+}', async (c, next) => {
	const first = c.req.param('first').split('/')[0];
	if (reservedPaths.includes(first)) {
		c.status(404);
		return c.render(notFoundHtml);
	}
	return next();
});

const qrResponseDoc = {
	200: {
		content: { 'text/html': { schema: z.string() } },
		description: 'QR code returned successfully.',
	},
	404: {
		content: { 'text/html': { schema: z.string() } },
		description: 'Short link not found.',
	},
};

const redirectResponseDoc = {
	302: {
		content: { 'text/html': { schema: z.string() } },
		description: 'Redirects link',
	},
	404: {
		content: { 'text/html': { schema: z.string() } },
		description: 'Short link not found.',
	},
};

app.openapi(
	createRoute({
		method: 'get',
		path: '/:id/qr',
		tags: ['QR'],
		request: {
			params: LinkWithNRequestParamsSchema,
			query: LinkQrRequestOptionsSchema,
		},
		responses: qrResponseDoc,
		summary: 'QR code for short link',
		description: 'Return QR code for short link in various formats. Available formats: png, svg and html.',
	}),
	async (c: Context<{ Bindings: Env }>) => {
		const { id } = c.req.param();
		const value = await getLinkWithD1Fallback(c.env, id);
		const { format, error_correction, cell_size, margin } = c.req.query();

		if (value === null) {
			const { contentType, body } = notFoundQrResponse(format);
			c.header('Content-Type', contentType);
			c.status(404);
			return c.body(body);
		}

		const { url } = linkWithUrl(c.req.url, value as LinkKVSchema);
		const { contentType, body } = await qrResponse(url, {
			format,
			error_correction,
			cell_size,
			margin,
		});
		c.header('Content-Type', contentType);
		return c.body(body);
	}
);

app.openapi(
	createRoute({
		method: 'get',
		path: '/:id',
		tags: ['Redirects'],
		request: { params: LinkWithNRequestParamsSchema },
		responses: redirectResponseDoc,
		summary: 'Redirect short link',
		description: 'Redirect short link to destination URL.',
	}),
	async (c: Context<{ Bindings: Env }>) => {
		const { id } = c.req.param();
		const value = await getLinkWithD1Fallback(c.env, id);

		if (value === null) {
			c.status(404);
			return c.render(notFoundHtml);
		}

		const { destinationUrl } = value as LinkKVSchema;
		c.executionCtx.waitUntil(trackLinkRedirect(id, c.req.raw, c.env));

		return c.redirect(destinationUrl, 302);
	}
);

app.openapi(
	createRoute({
		method: 'get',
		path: '/:namespace/:shortPath/qr',
		tags: ['QR'],
		request: {
			params: LinkWithNamespaceRequestParamsSchema,
			query: LinkQrRequestOptionsSchema,
		},
		responses: qrResponseDoc,
		summary: 'QR code for link with namespace',
		description: 'Return QR code for short link in various formats. Available formats: png, svg and html.',
	}),
	async (c: Context<{ Bindings: Env }>) => {
		const { namespace, shortPath } = c.req.param();
		const id = `${namespace}-${shortPath}`;
		const value = await getLinkWithD1Fallback(c.env, id);
		const { format, error_correction, cell_size, margin } = c.req.query();

		if (value === null) {
			const { contentType, body } = notFoundQrResponse(format);
			c.header('Content-Type', contentType);
			c.status(404);
			return c.body(body);
		}

		const { url } = linkWithUrl(c.req.url, value as LinkKVSchema);
		const { contentType, body } = await qrResponse(url, {
			format,
			error_correction,
			cell_size,
			margin,
		});
		c.header('Content-Type', contentType);
		return c.body(body);
	}
);

app.openapi(
	createRoute({
		method: 'get',
		path: '/:namespace/:shortPath',
		tags: ['Redirects'],
		request: { params: LinkWithNamespaceRequestParamsSchema },
		responses: redirectResponseDoc,
		summary: 'Redirect short link with namespace',
		description: 'Redirect short link to destination URL.',
	}),
	async (c: Context<{ Bindings: Env }>) => {
		const { namespace, shortPath } = c.req.param();
		const id = `${namespace}-${shortPath}`;
		const value = await getLinkWithD1Fallback(c.env, id);

		if (value === null) {
			c.status(404);
			return c.render(notFoundHtml);
		}

		const { destinationUrl } = value as LinkKVSchema;
		c.executionCtx.waitUntil(trackLinkRedirect(id, c.req.raw, c.env));

		return c.redirect(destinationUrl, 302);
	}
);

app.use('/*', async (c: Context<{ Bindings: Env }>) => {
	c.status(404);
	return c.render(notFoundHtml);
});

export default app;
