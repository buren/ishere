import { Context, Next } from 'hono';
import { errorResponse } from '../utils/error-response';
import timingSafeEqual from '../utils/timing-safe-equal';

const FIVE_MINUTES_IN_SECONDS = 60 * 5;

export default async function slackSignatureVerifyMiddleware(
	c: Context<{ Bindings: Env; Variables: { slackBody: string } }>,
	next: Next
) {
	const signingSecret = c.env.SLACK_SIGNING_SECRET;
	if (!signingSecret) {
		return c.json(errorResponse('Slack signing secret not configured'), 500);
	}

	const timestamp = c.req.header('X-Slack-Request-Timestamp');
	const signature = c.req.header('X-Slack-Signature');

	if (!timestamp || !signature) {
		return c.json(errorResponse('Missing Slack signature headers'), 401);
	}

	const now = Math.floor(Date.now() / 1000);
	if (Math.abs(now - Number(timestamp)) > FIVE_MINUTES_IN_SECONDS) {
		return c.json(errorResponse('Slack request timestamp is too old'), 401);
	}

	const body = await c.req.text();
	const baseString = `v0:${timestamp}:${body}`;

	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(signingSecret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);

	const signatureBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(baseString));
	const hex = Array.from(new Uint8Array(signatureBytes))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
	const computed = `v0=${hex}`;

	const isValid = await timingSafeEqual(computed, signature);
	if (!isValid) {
		return c.json(errorResponse('Invalid Slack signature'), 401);
	}

	c.set('slackBody', body);
	await next();
}
