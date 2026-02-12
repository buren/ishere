import { createRoute } from '@hono/zod-openapi';
import {
	buildRequestDoc,
	internalServerErrorResponseData,
	jsonResponseDoc,
	standardResponsesDoc,
} from '../../../openapi';
import { listLinksByNamespaceAction } from '../../../actions';
import StatusError from '../../../errors/status-error';
import statusErrorToJson from '../../../utils/status-error-to-json';
import {
	ListLinksByNamespaceParamsSchema,
	ListLinksByNamespaceQuerySchema,
	ListLinksByNamespaceResponseSchema,
} from '../../../schema';
import { defaultListLimit, maximumListLimit } from '../../../utils/constants';
import { createApp } from '../../app';

const SUCCESS_STATUS = 200;

const app = createApp();

app.openapi(
	createRoute({
		method: 'get',
		path: '/namespace/:namespace',
		tags: ['API'],
		request: {
			...buildRequestDoc({ params: ListLinksByNamespaceParamsSchema, auth: false }),
			query: ListLinksByNamespaceQuerySchema,
		},
		responses: {
			...jsonResponseDoc(SUCCESS_STATUS, ListLinksByNamespaceResponseSchema, 'Links retrieved successfully'),
			...standardResponsesDoc({ auth: false, validations: false }),
		},
		summary: 'List links by namespace',
		description: 'List all links under a given namespace.',
	}),
	async (c) => {
		const { namespace } = c.req.param();
		const { limit: limitStr, offset: offsetStr } = c.req.query();

		const limit = Math.min(Math.max(parseInt(limitStr) || defaultListLimit, 1), maximumListLimit);
		const offset = Math.max(parseInt(offsetStr) || 0, 0);

		try {
			const { data } = await listLinksByNamespaceAction({
				url: c.req.url,
				data: { namespace, limit, offset },
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
