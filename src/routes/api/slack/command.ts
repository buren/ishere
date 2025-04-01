import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import {
	buildSlackRequestDoc,
	jsonResponseDoc,
} from '../../../openapi';
import { handleSlackCommandAction } from '../../../actions';
import { SlackCommandRequestSchema, SlackCommandResponseSchema } from '../../../types';
import { slackRespondWithMessage } from '../../../utils/slack-respond-with';
import { SLACK_COMMAND_USAGE_MRKDWN } from '../../../utils/parse-slack-command';

const SUCCESS_STATUS = 200;

const app = new OpenAPIHono<{ Bindings: Env }>();

app.openapi(
	createRoute({
		method: 'post',
		path: '/command',
		tags: ['Slack'],
		request: buildSlackRequestDoc({ schema: SlackCommandRequestSchema }),
		responses: {
			...jsonResponseDoc(SUCCESS_STATUS, SlackCommandResponseSchema, 'Slack command handled correctly.'),
		},
		summary: 'Slack command',
		description: SLACK_COMMAND_USAGE_MRKDWN,
	}),
	async (c) => {
		// NOTE: We get the api key from the query string because the slack slash command
		// request does not include the API key in the header.
		const { apiKey } = c.req.query();
		if (apiKey !== c.env.API_TOKEN) {
			return c.json(slackRespondWithMessage('Invalid API key. Use query param: apiKey={your-api-key}'), SUCCESS_STATUS);
		}

		const formData = await c.req.formData();
		const text = (formData.get('text') || '') as string;

		try {
			const data = await handleSlackCommandAction({
				url: c.req.url,
				text,
				env: c.env,
				ctx: c.executionCtx,
			});

			return c.json(data, SUCCESS_STATUS);
		} catch (error) {
			console.log(error);
			return c.json(slackRespondWithMessage('Sorry, something went wrong.'), 500);
		}
	}
);

export default app;
