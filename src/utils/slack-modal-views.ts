import { LinkWithUrls } from './link-with-url';

export const createLinkModalView = () => ({
	type: 'modal' as const,
	callback_id: 'create_link',
	title: { type: 'plain_text' as const, text: 'Create short link' },
	submit: { type: 'plain_text' as const, text: 'Create' },
	close: { type: 'plain_text' as const, text: 'Cancel' },
	blocks: [
		{
			type: 'input',
			block_id: 'destination_url_block',
			element: {
				type: 'url_text_input',
				action_id: 'destination_url',
				placeholder: { type: 'plain_text', text: 'https://example.com' },
			},
			label: { type: 'plain_text', text: 'Destination URL' },
		},
		{
			type: 'input',
			block_id: 'namespace_block',
			optional: true,
			element: {
				type: 'plain_text_input',
				action_id: 'namespace',
				placeholder: { type: 'plain_text', text: 'my-brand' },
			},
			label: { type: 'plain_text', text: 'Namespace' },
		},
		{
			type: 'input',
			block_id: 'short_path_block',
			optional: true,
			element: {
				type: 'plain_text_input',
				action_id: 'short_path',
				placeholder: { type: 'plain_text', text: 'campaign' },
			},
			label: { type: 'plain_text', text: 'Short path' },
		},
	],
});

export const lookUpLinkModalView = () => ({
	type: 'modal' as const,
	callback_id: 'look_up_link',
	title: { type: 'plain_text' as const, text: 'Look up link' },
	submit: { type: 'plain_text' as const, text: 'Look up' },
	close: { type: 'plain_text' as const, text: 'Cancel' },
	blocks: [
		{
			type: 'input',
			block_id: 'link_id_block',
			element: {
				type: 'plain_text_input',
				action_id: 'link_id',
				placeholder: { type: 'plain_text', text: 'abc12 or my-brand-campaign' },
			},
			label: { type: 'plain_text', text: 'Link ID' },
		},
	],
});

const linkDetailLines = (link: LinkWithUrls) => [
	`*Short URL:* ${link.url}`,
	`*Destination:* ${link.destinationUrl}`,
	`*QR URL:* ${link.qrUrl}`,
	`*Namespace:* ${link.namespace ?? 'none'}`,
];

export const createLinkResultModalView = (link: LinkWithUrls) => ({
	type: 'modal' as const,
	callback_id: 'create_link_result',
	title: { type: 'plain_text' as const, text: 'Link created' },
	close: { type: 'plain_text' as const, text: 'Done' },
	blocks: [
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: linkDetailLines(link).join('\n'),
			},
		},
	],
});

export const lookUpLinkResultModalView = (link: LinkWithUrls) => ({
	type: 'modal' as const,
	callback_id: 'look_up_link_result',
	title: { type: 'plain_text' as const, text: 'Link details' },
	close: { type: 'plain_text' as const, text: 'Done' },
	blocks: [
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: [
					`*ID:* ${link.id}`,
					...linkDetailLines(link),
					`*Created:* ${link.createdAt}`,
					`*Updated:* ${link.updatedAt}`,
					`*Expires:* ${link.expiresAt ?? 'never'}`,
				].join('\n'),
			},
		},
	],
});
