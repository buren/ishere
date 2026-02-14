import { LinkWithUrls } from './link-with-url';

type WebhookEvent = 'link.created' | 'link.updated' | 'link.deleted';

type NotifyWebhookParams = {
	event: WebhookEvent;
	link: LinkWithUrls;
	env: Env;
};

const sign = async (secret: string, body: string): Promise<string> => {
	const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
		'sign',
	]);
	const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
	return Array.from(new Uint8Array(signature))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
};

export const notifyWebhook = async ({ event, link, env }: NotifyWebhookParams): Promise<void> => {
	if (!env.WEBHOOK_URL) {
		return;
	}

	try {
		const body = JSON.stringify({
			event,
			timestamp: new Date().toISOString(),
			link,
		});

		const headers: Record<string, string> = { 'Content-Type': 'application/json' };

		if (env.WEBHOOK_SECRET) {
			headers['X-Webhook-Signature-256'] = `sha256=${await sign(env.WEBHOOK_SECRET, body)}`;
		}

		await fetch(env.WEBHOOK_URL, { method: 'POST', headers, body });
	} catch (error) {
		console.error('Failed to notify webhook:', error);
	}
};
