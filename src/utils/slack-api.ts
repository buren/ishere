type SlackPostMessageParams = {
	channel: string;
	text: string;
	blocks?: unknown[];
};

type SlackPostMessageResponse = {
	ok: boolean;
	error?: string;
	ts?: string;
};

export const slackPostMessage = async (
	token: string,
	{ channel, text, blocks }: SlackPostMessageParams
): Promise<SlackPostMessageResponse> => {
	const response = await fetch('https://slack.com/api/chat.postMessage', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ channel, text, blocks }),
	});

	return response.json() as Promise<SlackPostMessageResponse>;
};

type SlackRespondToUrlParams = {
	text?: string;
	blocks?: unknown[];
	replace_original?: boolean;
};

export const slackRespondToUrl = async (
	responseUrl: string,
	{ text, blocks, replace_original }: SlackRespondToUrlParams
): Promise<{ ok: boolean }> => {
	const response = await fetch(responseUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ text, blocks, replace_original }),
	});

	return response.json() as Promise<{ ok: boolean }>;
};
