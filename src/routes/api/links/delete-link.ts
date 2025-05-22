import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import {
	buildRequestDoc,
	internalServerErrorResponseData,
	jsonResponseDoc,
	standardResponsesDoc,
} from '../../../openapi';
import { deleteLinkAction } from '../../../actions';
import StatusError from '../../../errors/status-error';
import statusErrorToJson from '../../../utils/status-error-to-json';
import { DeleteLinkRequestSchema, LinkDeleteResponseSchema, LinkParamsSchema, LinkResponseSchema } from '../../../schema';
import apiKeyAuthMiddleware from '../../../middleware/auth';

const SUCCESS_STATUS = 202;

const app = new OpenAPIHono<{ Bindings: Env }>();

app.openapi(
	createRoute({
		method: 'delete',
		path: '/:id',
		tags: ['API'],
		middleware: apiKeyAuthMiddleware,
		request: buildRequestDoc({ schema: DeleteLinkRequestSchema, params: LinkParamsSchema }),
		responses: {
			...jsonResponseDoc(
				SUCCESS_STATUS,
				LinkDeleteResponseSchema,
				'Short link deleted successfully'
			),
			...standardResponsesDoc(),
		},
		summary: 'Delete short link',
		security: [{ apiKey: [] }],
		description: `Deletes a short link.

⚠️ Can take up to 60 seconds to propagate.`,
	}),
	async (c) => {
		const { id } = c.req.param();

		try {
			const { data } = await deleteLinkAction({
				url: c.req.url,
				data: { id },
				env: c.env,
				ctx: c.executionCtx,
			});

			return c.json(data, SUCCESS_STATUS);
		} catch (error) {
			console.log(error);

			if (error instanceof StatusError) {
				const { status, data } = statusErrorToJson(error);
				return c.json(data, status);
			}

			return c.json(internalServerErrorResponseData(), 500);
		}
	}
);

export default app;
