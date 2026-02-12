import { describe, it, expect } from 'vitest';
import {
	slackRespondWithMessage,
	slackRespondWithMarkdown,
	slackLinkNotificationText,
	slackLinkNotificationBlocks,
} from '../../src/utils/slack-respond-with';

describe('slackRespondWithMessage', () => {
	it('should return ephemeral text response', () => {
		expect(slackRespondWithMessage('hello')).toEqual({
			response_type: 'ephemeral',
			text: 'hello',
		});
	});
});

describe('slackRespondWithMarkdown', () => {
	it('should return a section block with mrkdwn', () => {
		const result = slackRespondWithMarkdown('*bold*');
		expect(result.blocks).toEqual([
			{ type: 'section', text: { type: 'mrkdwn', text: '*bold*' } },
		]);
	});
});

describe('slackLinkNotificationText', () => {
	it('should return a plain text summary', () => {
		const text = slackLinkNotificationText('created', 'https://sho.rt/abc', 'https://example.com');
		expect(text).toBe('Link created: https://sho.rt/abc → https://example.com');
	});

	it('should work for updated action', () => {
		const text = slackLinkNotificationText('updated', 'https://sho.rt/xyz', 'https://new.com');
		expect(text).toBe('Link updated: https://sho.rt/xyz → https://new.com');
	});
});

describe('slackLinkNotificationBlocks', () => {
	it('should return a section block with link info and action buttons', () => {
		const blocks = slackLinkNotificationBlocks('created', 'abc', 'https://sho.rt/abc', 'https://example.com') as any[];

		expect(blocks).toHaveLength(2);
		expect(blocks[0]).toEqual({
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: ':link: *Link created*\n*Short URL:* https://sho.rt/abc\n*Destination:* https://example.com',
			},
		});

		expect(blocks[1].type).toBe('actions');
		expect(blocks[1].elements).toHaveLength(3);

		expect(blocks[1].elements[0]).toEqual({
			type: 'button',
			text: { type: 'plain_text', text: 'View Stats' },
			action_id: 'view_stats',
			value: 'abc',
		});
		expect(blocks[1].elements[1]).toEqual({
			type: 'button',
			text: { type: 'plain_text', text: 'View Details' },
			action_id: 'view_details',
			value: 'abc',
		});
		expect(blocks[1].elements[2]).toEqual({
			type: 'button',
			text: { type: 'plain_text', text: 'Edit Destination' },
			action_id: 'edit_destination',
			value: 'abc',
		});
	});
});
