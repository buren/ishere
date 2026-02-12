import { createRoute, z } from '@hono/zod-openapi';
import { buildRequestDoc, internalServerErrorResponseData, jsonResponseDoc, standardResponsesDoc } from '../../../openapi';
import { updateLinkAction } from '../../../actions';
import StatusError from '../../../errors/status-error';
import statusErrorToJson from '../../../utils/status-error-to-json';
import { UpdateLinkRequestSchema, LinkResponseSchema, LinkParamsSchema } from '../../../schema';
import apiKeyAuthMiddleware from '../../../middleware/auth';
import { createApp } from '../../app';

const SUCCESS_STATUS = 202;

const app = createApp();

app.openapi(
	createRoute({
		method: 'patch',
		path: '/:id',
		tags: ['API'],
		middleware: apiKeyAuthMiddleware,
		request: buildRequestDoc({ schema: UpdateLinkRequestSchema, params: LinkParamsSchema }),
		responses: {
			...jsonResponseDoc(SUCCESS_STATUS, LinkResponseSchema, 'Short link updated successfully'),
			...standardResponsesDoc({ validations: true }),
		},
		summary: 'Update short link',
		security: [{ apiKey: [] }],
		description: 'Update a short link.',
	}),
	async (c) => {
		const { id } = c.req.param();
		const json = c.req.valid('json');

		try {
			const { data} = await updateLinkAction({
				url: c.req.url,
				data: { ...json, id },
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
