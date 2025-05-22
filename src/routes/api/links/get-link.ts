import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import {
	buildRequestDoc,
	internalServerErrorResponseData,
	jsonResponseDoc,
	standardResponsesDoc,
} from '../../../openapi';
import { getLinkAction } from '../../../actions';
import StatusError from '../../../errors/status-error';
import statusErrorToJson from '../../../utils/status-error-to-json';
import { GetLinkRequestSchema, LinkParamsSchema, LinkResponseSchema } from '../../../schema';

const SUCCESS_STATUS = 202;

const app = new OpenAPIHono<{ Bindings: Env }>();

app.openapi(
	createRoute({
		method: 'get',
		path: '/:id',
		tags: ['API'],
		request: buildRequestDoc({ schema: GetLinkRequestSchema, params: LinkParamsSchema, auth: false }),
		responses: {
			...jsonResponseDoc(SUCCESS_STATUS, LinkResponseSchema, 'Short link retrieved successfully'),
			...standardResponsesDoc({ auth: false, validations: false }),
		},
		summary: 'Get short link',
		description: 'Get a short link.',
	}),
	async (c) => {
		const { id } = c.req.param();

		try {
			const { data } = await getLinkAction({
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
