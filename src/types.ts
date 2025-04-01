import { Context } from 'hono';
import { z } from 'zod';
import {
	defaultShortPathLength,
	linkIdPattern,
	maximumNamespaceLength,
	maximumShortPathLength,
	minimumExpirationTtl,
	minimumShortPathLength,
} from './utils/constants';

export type LinkKVSchema = {
	destinationUrl: string;
	id: string;
	namespace?: string | null;
	createdAt: string;
	updatedAt: string;
};

export type LinkDbSchema = LinkKVSchema;

export type GroupBy = 'day' | 'hour';

export type ActionHttpStatus = 200 | 400 | 401 | 403 | 404 | 500 | 503;

export type ActionContext<TBody = unknown> = {
	url: string;
	data: TBody;
	env: Env;
};

export type ActionResult<T> = {
	data: T;
	waitFor?: Promise<any>[];
};

export type Action<TBody = any, TResponseBody = any> = (
	context: ActionContext<TBody>
) => Promise<ActionResult<TResponseBody>>;

// Hono
export type AppContext = Context<{ Bindings: Env }>;

// Schema
export const CreateLinkRequestSchema = z.object({
	destinationUrl: z.string().url().describe('URL to be shortened.'),
	shortPath: z
		.string()
		.regex(linkIdPattern)
		.min(minimumShortPathLength)
		.max(maximumShortPathLength)
		.optional()
		.describe('Custom short path.'),
	namespace: z
		.string()
		.regex(linkIdPattern)
		.max(maximumNamespaceLength)
		.optional()
		.describe(`Custom namespace (max ${maximumNamespaceLength} characters).`),
	length: z
		.number()
		.int()
		.min(minimumShortPathLength)
		.max(maximumShortPathLength)
		.optional()
		.default(defaultShortPathLength)
		.describe('Length of the short path.'),
	expirationTtl: z
		.number()
		.int()
		.min(minimumExpirationTtl)
		.optional()
		.describe(`Expiration time in seconds (min ${minimumExpirationTtl} seconds). Omit for no expiration.`),
});

export type CreateLinkRequestBody = z.infer<typeof CreateLinkRequestSchema>;

export const UpdateLinkRequestSchema = z.object({
	destinationUrl: z.string().url().describe('Destination URL for the short link.'),
	expirationTtl: z
		.number()
		.int()
		.min(minimumExpirationTtl)
		.optional()
		.describe(`Expiration time in seconds (min ${minimumExpirationTtl} seconds). Omit for no expiration.`),
});

export type UpdateLinkRequestBody = z.infer<typeof UpdateLinkRequestSchema>;

export const DeleteLinkRequestSchema = z.object({});

export const GetLinkRequestSchema = z.object({});

export const GetLinkStatsRequestSchema = z.object({});

export const LinkResponseSchema = z.object({
	destinationUrl: z.string().url().describe('URL to be shortened.'),
	id: z.string().describe('Short link ID.'),
	url: z.string().url().describe('Short link URL.'),
});

export const SlackCommandRequestSchema = z.object({
	text: z.string().describe(`Command text. See _[usage instructions](#tag/default/POST/api/slack/command)_ for command format.`),
});

export const SlackCommandResponseSchema = z.object({
	response_type: z.string().optional().describe('Response type.'),
	text: z.string().optional().describe('Message text.'),
	blocks: z.array(
		z.object({
			type: z.string().describe('Block type'),
			text: z
				.object({
					type: z.string().describe('Text type, e.g mrkdwn.'),
					text: z.string().describe('Message text'),
				})
				.describe('Text object.'),
		})
	).optional(),
});

export const LinkQrRequestOptionsSchema = z.object({
	format: z.enum(['svg', 'png', 'html']).optional().default('svg').describe('Format of the returned QR code.'),
	error_correction: z.enum(['L', 'M', 'Q', 'H']).optional().default('L').describe('QR code error correcation.'),
	cell_size: z.string().optional().default('8').describe('Size of QR code cells (is not pixels).'),
	margin: z.string().optional().default('4').describe('Margin around QR code.'),
});

const shortLinkIdParam = z
	.string()
	.openapi({
		param: {
			name: 'id',
			in: 'path',
		},
		example: 'ee2A2',
	})
	.describe('Short link ID.');

export const LinkWithNRequestParamsSchema = z.object({
	id: shortLinkIdParam,
});

export const LinkWithNamespaceRequestParamsSchema = z.object({
	namespace: z
		.string()
		.openapi({
			param: {
				name: 'namespace',
				in: 'path',
			},
			example: 'washere',
		})
		.describe('Link namespace.'),
	shortPath: z
		.string()
		.openapi({
			param: {
				name: 'shortPath',
				in: 'path',
			},
			example: 'ee2A2',
		})
		.describe('Short path of the link (id minus namespace).'),
});

export const LinkParamsSchema = z.object({
	id: shortLinkIdParam,
});

export const LinkStatsParamsSchema = z.object({
	id: shortLinkIdParam,
	// TODO this is actually an enum: day, hour
	groupBy: z
		.enum(['day', 'hour'])
		.openapi({
			param: {
				name: 'groupBy',
				in: 'path',
			},
			examples: ['day', 'hour'],
		})
		.describe('Group stats by day or hour.'),
});