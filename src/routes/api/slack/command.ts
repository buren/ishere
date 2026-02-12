import { createRoute } from '@hono/zod-openapi';
import { buildSlackRequestDoc, jsonResponseDoc } from '../../../openapi';
import { handleSlackCommandAction } from '../../../actions';
import { SlackCommandRequestSchema, SlackCommandResponseSchema } from '../../../schema';
import { slackRespondWithMessage } from '../../../utils/slack-respond-with';
import { SLACK_COMMAND_USAGE_MRKDWN } from '../../../utils/parse-slack-command';
import { createApp } from '../../app';

const SUCCESS_STATUS = 200;

const app = createApp();

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
		description: `This is a Slack command endpoint. It handles the command sent from Slack and responds with a message.

${SLACK_COMMAND_USAGE_MRKDWN}`,
	}),
	async (c) => {
		// NOTE: We get the api key from the query string because the slack slash command
		// request does not include the API key in the header.
		const { apiKey } = c.req.query();
		if (apiKey !== c.env.API_KEY) {
			return c.json(slackRespondWithMessage('Invalid API key. Use query param: apiKey=yourapikey'), SUCCESS_STATUS);
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
			console.error(error);
			return c.json(slackRespondWithMessage('Sorry, something went wrong.'), 500);
		}
	}
);

export default app;
