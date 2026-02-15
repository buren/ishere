import { slackPostMessage } from '../utils/slack-api';
import { slackLinkNotificationBlocks, slackLinkNotificationText } from '../utils/slack-respond-with';

type NotifySlackLinkChangeParams = {
	action: string;
	linkId: string;
	shortUrl: string;
	destinationUrl: string;
	env: Env;
};

export const notifySlackLinkChange = async ({
	action,
	linkId,
	shortUrl,
	destinationUrl,
	env,
}: NotifySlackLinkChangeParams): Promise<void> => {
	if (!env.SLACK_BOT_TOKEN || !env.SLACK_CHANNEL_ID) {
		console.log('Slack notification skipped: SLACK_BOT_TOKEN or SLACK_CHANNEL_ID is not defined');
		return;
	}

	try {
		await slackPostMessage(env.SLACK_BOT_TOKEN, {
			channel: env.SLACK_CHANNEL_ID,
			text: slackLinkNotificationText(action, shortUrl, destinationUrl),
			blocks: slackLinkNotificationBlocks(action, linkId, shortUrl, destinationUrl),
		});
	} catch (error) {
		console.error('Failed to notify Slack:', error);
	}
};
