import { handleSlackInteractionAction } from '../../../actions/handle-slack-interaction-action';
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
