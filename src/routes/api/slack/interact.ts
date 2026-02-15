import { handleSlackInteractionAction } from '../../../actions/handle-slack-interaction-action';
import { handleSlackShortcutAction } from '../../../actions/handle-slack-shortcut-action';
import { handleSlackViewSubmissionAction } from '../../../actions/handle-slack-view-submission-action';
import slackSignatureVerifyMiddleware from '../../../middleware/slack-verify';
import { createApp } from '../../app';

const app = createApp();

app.post('/interact', slackSignatureVerifyMiddleware, async (c) => {
	const body = c.get('slackBody');
	const params = new URLSearchParams(body);
	const payloadStr = params.get('payload');

	if (!payloadStr) {
		return c.json({ error: 'Missing payload' }, 400);
	}

	let payload;
	try {
		payload = JSON.parse(payloadStr);
	} catch {
		return c.json({ error: 'Invalid payload' }, 400);
	}

	if (payload.type === 'shortcut') {
		c.executionCtx.waitUntil(
			handleSlackShortcutAction({ payload, env: c.env })
		);
		return c.body(null, 200);
	}

	if (payload.type === 'view_submission') {
		const result = await handleSlackViewSubmissionAction({
			payload,
			requestUrl: c.req.url,
			env: c.env,
			ctx: c.executionCtx,
		});
		if (result) {
			return c.json(result);
		}
		return c.body(null, 200);
	}

	// block_actions — fire-and-forget
	c.executionCtx.waitUntil(
		handleSlackInteractionAction({
			payload,
			requestUrl: c.req.url,
			env: c.env,
		})
	);

	return c.body(null, 200);
});

export default app;
