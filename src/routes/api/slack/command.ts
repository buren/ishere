import { createRoute } from '@hono/zod-openapi';
import { buildSlackRequestDoc, jsonResponseDoc } from '../../../openapi';
import { handleSlackCommandAction } from '../../../actions';
import { SlackCommandRequestSchema, SlackCommandResponseSchema } from '../../../schema';
import { slackRespondWithMessage } from '../../../utils/slack-respond-with';
import { SLACK_COMMAND_USAGE_MRKDWN } from '../../../utils/parse-slack-command';
import slackSignatureVerifyMiddleware from '../../../middleware/slack-verify';
import { createApp } from '../../app';

const SUCCESS_STATUS = 200;

const app = createApp();

app.openapi(
	createRoute({
		method: 'post',
		path: '/command',
		tags: ['Slack'],
		middleware: slackSignatureVerifyMiddleware,
		request: buildSlackRequestDoc({ schema: SlackCommandRequestSchema }),
		responses: {
			...jsonResponseDoc(SUCCESS_STATUS, SlackCommandResponseSchema, 'Slack command handled correctly.'),
		},
		summary: 'Slack command',
		description: `This is a Slack command endpoint. It handles the command sent from Slack and responds with a message.

${SLACK_COMMAND_USAGE_MRKDWN}`,
	}),
	async (c) => {
		const body = c.get('slackBody');
		const params = new URLSearchParams(body);
		const text = (params.get('text') || '') as string;

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
