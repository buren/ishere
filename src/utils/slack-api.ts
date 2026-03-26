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

type SlackRespondToUrlParams = {
	text?: string;
	blocks?: unknown[];
	replace_original?: boolean;
};

type SlackViewsOpenParams = {
	trigger_id: string;
	view: Record<string, unknown>;
};

type SlackViewsOpenResponse = {
	ok: boolean;
	error?: string;
};

const assertSlackResponse = async <T extends { ok: boolean; error?: string }>(
	response: Response,
	context: string
): Promise<T> => {
	if (!response.ok) {
		throw new Error(`Slack API ${context} HTTP error: ${response.status}`);
	}
	const data = (await response.json()) as T;
	if (!data.ok) {
		throw new Error(`Slack API ${context} error: ${data.error ?? 'unknown'}`);
	}
	return data;
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

	return assertSlackResponse<SlackPostMessageResponse>(response, 'chat.postMessage');
};

export const slackViewsOpen = async (
	token: string,
	{ trigger_id, view }: SlackViewsOpenParams
): Promise<SlackViewsOpenResponse> => {
	const response = await fetch('https://slack.com/api/views.open', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ trigger_id, view }),
	});

	return assertSlackResponse<SlackViewsOpenResponse>(response, 'views.open');
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

	return assertSlackResponse<{ ok: boolean; error?: string }>(response, 'response_url');
};
