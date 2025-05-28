import { getLinkWithD1Fallback } from '../../utils/get-link-with-d1-fallback';
import { LinkKVSchema } from '../../types';
import { LinkQrRequestOptionsSchema, LinkWithNamespaceRequestParamsSchema, LinkWithNRequestParamsSchema } from '../../schema';
import { notFoundHtml } from '../../html';
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { Context } from 'hono';
import { linkWithUrl } from '../../utils/link-with-url';
import qrResponse from '../../utils/qr-response';
import trackLinkRedirect from '../../analytics/track-link-redirect';

// Link shortening routes
const app = new OpenAPIHono<{ Bindings: Env }>();

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

		// TODO we can't assume HTML format here, we need to respect the requested format
		if (value === null) {
			c.status(404);
			return c.render(notFoundHtml);
		}

		const { url } = linkWithUrl(c.req.url, value as LinkKVSchema);
		const { format, error_correction, cell_size, margin } = c.req.query();
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
		console.log(`Redirecting /${id} to ${destinationUrl}`);
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

		// TODO we can't assume HTML format here, we need to respect the requested format
		if (value === null) {
			c.status(404);
			return c.render(notFoundHtml);
		}

		const { url } = linkWithUrl(c.req.url, value as LinkKVSchema);
		const { format, error_correction, cell_size, margin } = c.req.query();
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
		console.log(`Redirecting /${id} to ${destinationUrl}`);
		c.executionCtx.waitUntil(trackLinkRedirect(id, c.req.raw, c.env));

		return c.redirect(destinationUrl, 302);
	}
);

app.use('/*', async (c: Context<{ Bindings: Env }>) => {
	c.status(404);
	return c.render(notFoundHtml);
});

export default app;
