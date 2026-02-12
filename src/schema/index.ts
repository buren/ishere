import { z } from "zod";
import {
	defaultListLimit,
	defaultShortPathLength,
	linkIdPattern,
	maximumListLimit,
	maximumNamespaceLength,
	maximumShortPathLength,
	minimumExpirationTtl,
	minimumShortPathLength,
} from '../utils/constants';
import { messages } from "../actions";

export const ErrorResponseSchema = z.object({
	error: z.object({
		message: z.string(),
	}),
});

export const errorResponseSchemaWithExample = (example: string) =>
	z.object({
		error: z.object({
			message: z.string().openapi({ example }),
		}),
	});

export const ValidationErrorResponseSchema = z.object({
	error: z.object({
		message: z.string().openapi({ example: 'must be at least 3 characters' }),
		errors: z.array(
			z.object({
				field: z.string().openapi({ example: 'shortPath' }),
				code: z.string().openapi({ example: 'too_short' }),
				message: z.string().openapi({ example: 'must be at least 3 characters' }),
				params: z.record(z.string(), z.unknown()).optional().openapi({ example: { minimum: 3 } }),
			})
		),
	}),
});

export const CreateLinkRequestSchema = z.object({
	destinationUrl: z.string().url().describe('URL to be shortened.'),
	shortPath: z
		.string()
		.regex(linkIdPattern)
		.min(minimumShortPathLength)
		.max(maximumShortPathLength)
		.nullable()
		.optional()
		.describe('Custom short path.'),
	namespace: z
		.string()
		.regex(linkIdPattern)
		.max(maximumNamespaceLength)
		.nullable()
		.optional()
		.describe(`Custom namespace (max ${maximumNamespaceLength} characters).`),
	length: z
		.number()
		.int()
		.min(minimumShortPathLength)
		.max(maximumShortPathLength)
		.nullable()
		.optional()
		.default(defaultShortPathLength)
		.describe('Length of the short path.'),
	expirationTtl: z
		.number()
		.int()
		.min(minimumExpirationTtl)
		.nullable()
		.optional()
		.describe(
			`Expiration time in seconds (min ${minimumExpirationTtl} seconds). Omit for no expiration.`
		),
});

export type CreateLinkRequestBody = z.infer<typeof CreateLinkRequestSchema>;

export const UpdateLinkRequestSchema = z.object({
	destinationUrl: z.string().url().nullable().optional().describe('URL to be shortened.'),
	expirationTtl: z
		.number()
		.int()
		.min(minimumExpirationTtl)
		.nullable()
		.optional()
		.describe(
			`Expiration time in seconds (min ${minimumExpirationTtl} seconds). Omit for no expiration.`
		),
});

export type UpdateLinkRequestBodySchema = z.infer<typeof UpdateLinkRequestSchema>;

export const DeleteLinkRequestSchema = z.object({});

export const GetLinkRequestSchema = z.object({});

export const GetLinkStatsRequestSchema = z.object({});

export const ListLinksByNamespaceRequestSchema = z.object({});

export const ListLinksByNamespaceParamsSchema = z.object({
	namespace: z
		.string()
		.openapi({
			param: {
				name: 'namespace',
				in: 'path',
			},
			example: 'your-brand',
		})
		.describe('Link namespace.'),
});

export const LinkResponseSchema = z.object({
	destinationUrl: z.string().url().describe('URL to be shortened.'),
	id: z.string().describe('Short link ID.'),
	url: z.string().url().describe('Short link URL.'),
	qrUrl: z.string().url().describe('QR Code for short link URL.'),
	namespace: z.string().nullable().optional().describe('Short link namespace.'),
	expirationTtl: z.number().nullable().optional().describe('Expiration time in seconds.'),
	createdAt: z.string().datetime().describe('Creation timestamp.'),
	updatedAt: z.string().datetime().describe('Update timestamp.'),
	expiresAt: z.string().datetime().nullable().optional().describe('Expires at timestamp.'),
});

export const ListLinksByNamespaceQuerySchema = z.object({
	limit: z
		.string()
		.optional()
		.default(String(defaultListLimit))
		.openapi({ example: String(defaultListLimit) })
		.describe(`Maximum number of links to return (1–${maximumListLimit}).`),
	offset: z
		.string()
		.optional()
		.default('0')
		.openapi({ example: '0' })
		.describe('Number of links to skip.'),
});

export const ListLinksByNamespaceResponseSchema = z.object({
	data: z.array(LinkResponseSchema),
	total: z.number().describe('Total number of links in this namespace.'),
	limit: z.number().describe('Limit used for this request.'),
	offset: z.number().describe('Offset used for this request.'),
});

export const LinkDeleteResponseSchema = z.object({
	message: z.string().describe('Delete message.').openapi({ example: messages.deleteRequestReceived }),
});

export const SlackCommandRequestSchema = z.object({
	text: z.string().describe(`Command text. See _[usage instructions](#tag/default/POST/api/slack/command)_ for command format.`),
});

export const SlackCommandResponseSchema = z.object({
	response_type: z.string().optional().describe('Response type.'),
	text: z.string().optional().describe('Message text.'),
	blocks: z
		.array(
			z.object({
				type: z.string().describe('Block type'),
				text: z
					.object({
						type: z.string().describe('Text type, e.g mrkdwn.'),
						text: z.string().describe('Message text'),
					})
					.describe('Text object.'),
			})
		)
		.optional(),
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
			example: 'your-brand',
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

export const LinkStatsQuerySchema = z.object({
	exclude_bot_traffic: z
		.enum(['true', 'false'])
		.optional()
		.default('false')
		.openapi({
			examples: ['true', 'false'],
		})
		.describe('Exclude bot traffic from stats.'),
});
