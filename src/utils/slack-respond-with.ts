export const slackRespondWithMessage = (message: string) => ({
	response_type: 'ephemeral',
	text: message,
});

export const slackRespondWithMarkdown = (markdown: string) => ({
	blocks: [
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: markdown,
			},
		},
	],
});
