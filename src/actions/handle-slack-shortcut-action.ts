import { slackViewsOpen } from '../utils/slack-api';
import { createLinkModalView, lookUpLinkModalView } from '../utils/slack-modal-views';

type SlackShortcutPayload = {
	type: 'shortcut';
	callback_id: string;
	trigger_id: string;
};

type HandleSlackShortcutParams = {
	payload: SlackShortcutPayload;
	env: Env;
};

export const handleSlackShortcutAction = async ({
	payload,
	env,
}: HandleSlackShortcutParams): Promise<void> => {
	const token = env.SLACK_BOT_TOKEN;
	if (!token) {
		console.error('SLACK_BOT_TOKEN is not set, cannot open modal');
		return;
	}

	const view =
		payload.callback_id === 'create_link'
			? createLinkModalView()
			: payload.callback_id === 'look_up_link'
				? lookUpLinkModalView()
				: null;

	if (!view) {
		console.error(`Unknown shortcut callback_id: ${payload.callback_id}`);
		return;
	}

	try {
		const result = await slackViewsOpen(token, {
			trigger_id: payload.trigger_id,
			view,
		});

		if (!result.ok) {
			console.error('views.open failed:', result.error);
		}
	} catch (error) {
		console.error('Error opening modal:', error);
	}
};
