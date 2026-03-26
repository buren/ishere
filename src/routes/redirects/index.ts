import { LinkQrRequestOptionsSchema, LinkWithNamespaceRequestParamsSchema, LinkWithNRequestParamsSchema } from '../../schema';
import { notFoundHtml } from '../../html';
import { createRoute, z } from '@hono/zod-openapi';
import { Context } from 'hono';
import { reservedPaths } from '../../utils/constants';
import { createApp } from '../app';
import { handleQrRequest, handleInfoRequest, handleRedirectRequest, handlePasswordSubmit } from './handlers';

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

const previewResponseDoc = {
	200: {
		content: { 'text/html': { schema: z.string() } },
		description: 'Link preview page.',
	},
	404: {
		content: { 'text/html': { schema: z.string() } },
		description: 'Short link not found.',
	},
};

const redirectResponseDoc = {
	301: {
		content: { 'text/html': { schema: z.string() } },
		description: 'Permanent redirect to destination URL.',
	},
	302: {
		content: { 'text/html': { schema: z.string() } },
		description: 'Temporary redirect to destination URL.',
	},
	404: {
		content: { 'text/html': { schema: z.string() } },
		description: 'Short link not found.',
	},
};

// --- /:id routes ---

app.openapi(
	createRoute({
		method: 'get',
		path: '/:id/qr',
		tags: ['QR'],
		request: { params: LinkWithNRequestParamsSchema, query: LinkQrRequestOptionsSchema },
		responses: qrResponseDoc,
		summary: 'QR code for short link',
		description: 'Return QR code for short link in various formats. Available formats: png, svg and html.',
	}),
	async (c: Context<{ Bindings: Env }>) => handleQrRequest(c, c.req.param('id'))
);

app.openapi(
	createRoute({
		method: 'get',
		path: '/:id/info',
		tags: ['Link Preview'],
		request: { params: LinkWithNRequestParamsSchema },
		responses: previewResponseDoc,
		summary: 'Preview short link',
		description: 'Show a preview page with link metadata instead of redirecting.',
	}),
	async (c: Context<{ Bindings: Env }>) => handleInfoRequest(c, c.req.param('id'))
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
		const id = c.req.param('id');
		return handleRedirectRequest(c, id, `/${id}`);
	}
);

app.post('/:id', async (c: Context<{ Bindings: Env }>) => {
	const id = c.req.param('id');
	return handlePasswordSubmit(c, id, `/${id}`);
});

// --- /:namespace/:shortPath routes ---

app.openapi(
	createRoute({
		method: 'get',
		path: '/:namespace/:shortPath/qr',
		tags: ['QR'],
		request: { params: LinkWithNamespaceRequestParamsSchema, query: LinkQrRequestOptionsSchema },
		responses: qrResponseDoc,
		summary: 'QR code for link with namespace',
		description: 'Return QR code for short link in various formats. Available formats: png, svg and html.',
	}),
	async (c: Context<{ Bindings: Env }>) => {
		const { namespace, shortPath } = c.req.param();
		return handleQrRequest(c, `${namespace}-${shortPath}`);
	}
);

app.openapi(
	createRoute({
		method: 'get',
		path: '/:namespace/:shortPath/info',
		tags: ['Link Preview'],
		request: { params: LinkWithNamespaceRequestParamsSchema },
		responses: previewResponseDoc,
		summary: 'Preview short link with namespace',
		description: 'Show a preview page with link metadata instead of redirecting.',
	}),
	async (c: Context<{ Bindings: Env }>) => {
		const { namespace, shortPath } = c.req.param();
		return handleInfoRequest(c, `${namespace}-${shortPath}`);
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
		return handleRedirectRequest(c, `${namespace}-${shortPath}`, `/${namespace}/${shortPath}`);
	}
);

app.post('/:namespace/:shortPath', async (c: Context<{ Bindings: Env }>) => {
	const { namespace, shortPath } = c.req.param();
	return handlePasswordSubmit(c, `${namespace}-${shortPath}`, `/${namespace}/${shortPath}`);
});

// Catch-all 404
app.use('/*', async (c: Context<{ Bindings: Env }>) => {
	c.status(404);
	return c.render(notFoundHtml);
});

export default app;
