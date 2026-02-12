import { createRoute } from '@hono/zod-openapi';
import {
	buildRequestDoc,
	internalServerErrorResponseData,
	jsonResponseDoc,
	standardResponsesDoc,
} from '../../../openapi';
import { deleteLinkAction } from '../../../actions';
import StatusError from '../../../errors/status-error';
import statusErrorToJson from '../../../utils/status-error-to-json';
import { LinkDeleteResponseSchema, LinkParamsSchema } from '../../../schema';
import apiKeyAuthMiddleware from '../../../middleware/auth';
import { createApp } from '../../app';

const SUCCESS_STATUS = 202;

const app = createApp();

app.openapi(
	createRoute({
		method: 'delete',
		path: '/:id',
		tags: ['API'],
		middleware: apiKeyAuthMiddleware,
		request: buildRequestDoc({ params: LinkParamsSchema }),
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
			console.error(error);

			if (error instanceof StatusError) {
				const { status, data } = statusErrorToJson(error);
				return c.json(data, status);
			}

			return c.json(internalServerErrorResponseData(), 500);
		}
	}
);

export default app;
