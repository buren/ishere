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

export const slackLinkNotificationText = (action: string, shortUrl: string, destinationUrl: string): string =>
	`Link ${action}: ${shortUrl} → ${destinationUrl}`;

export const slackLinkNotificationBlocks = (action: string, linkId: string, shortUrl: string, destinationUrl: string): unknown[] => [
	{
		type: 'section',
		text: {
			type: 'mrkdwn',
			text: `:link: *Link ${action}*\n*Short URL:* ${shortUrl}\n*Destination:* ${destinationUrl}`,
		},
	},
	{
		type: 'actions',
		elements: [
			{
				type: 'button',
				text: { type: 'plain_text', text: 'View Stats' },
				action_id: 'view_stats',
				value: linkId,
			},
			{
				type: 'button',
				text: { type: 'plain_text', text: 'View Details' },
				action_id: 'view_details',
				value: linkId,
			},
			{
				type: 'button',
				text: { type: 'plain_text', text: 'Edit Destination' },
				action_id: 'edit_destination',
				value: linkId,
			},
		],
	},
];
