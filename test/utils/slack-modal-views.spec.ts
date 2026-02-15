import { describe, it, expect } from 'vitest';
import {
	createLinkModalView,
	lookUpLinkModalView,
	createLinkResultModalView,
	lookUpLinkResultModalView,
} from '../../src/utils/slack-modal-views';
import { LinkWithUrls } from '../../src/utils/link-with-url';

const makeLink = (overrides?: Partial<LinkWithUrls>): LinkWithUrls => ({
	id: 'abc12',
	destinationUrl: 'https://example.com',
	url: 'https://short.url/abc12',
	qrUrl: 'https://short.url/abc12/qr',
	namespace: null,
	createdAt: '2025-01-01T00:00:00.000Z',
	updatedAt: '2025-01-01T00:00:00.000Z',
	expiresAt: null,
	expirationTtl: null,
	redirectStatusCode: 302,
	passwordProtected: false,
	...overrides,
});

describe('createLinkModalView', () => {
	it('should return a modal with callback_id create_link', () => {
		const view = createLinkModalView();
		expect(view.type).toBe('modal');
		expect(view.callback_id).toBe('create_link');
	});

	it('should have all input blocks', () => {
		const view = createLinkModalView();
		const blockIds = view.blocks.map((b) => b.block_id);
		expect(blockIds).toEqual([
			'destination_url_block',
			'namespace_block',
			'short_path_block',
			'password_block',
			'expires_at_block',
			'scheduled_at_block',
		]);
	});

	it('should have optional fields marked as optional', () => {
		const view = createLinkModalView();
		const optionalBlockIds = view.blocks.filter((b) => b.optional).map((b) => b.block_id);
		expect(optionalBlockIds).toEqual([
			'namespace_block',
			'short_path_block',
			'password_block',
			'expires_at_block',
			'scheduled_at_block',
		]);
	});

	it('should use datetimepicker for expires_at and scheduled_at', () => {
		const view = createLinkModalView();
		const expiresBlock = view.blocks.find((b) => b.block_id === 'expires_at_block');
		const scheduledBlock = view.blocks.find((b) => b.block_id === 'scheduled_at_block');
		expect(expiresBlock!.element.type).toBe('datetimepicker');
		expect(scheduledBlock!.element.type).toBe('datetimepicker');
	});

	it('should use url_text_input for destination URL', () => {
		const view = createLinkModalView();
		const destBlock = view.blocks.find((b) => b.block_id === 'destination_url_block');
		expect(destBlock!.element.type).toBe('url_text_input');
	});
});

describe('lookUpLinkModalView', () => {
	it('should return a modal with callback_id look_up_link', () => {
		const view = lookUpLinkModalView();
		expect(view.type).toBe('modal');
		expect(view.callback_id).toBe('look_up_link');
	});

	it('should have a link ID input', () => {
		const view = lookUpLinkModalView();
		expect(view.blocks).toHaveLength(1);
		expect(view.blocks[0].block_id).toBe('link_id_block');
	});
});

describe('createLinkResultModalView', () => {
	it('should show link details without submit button', () => {
		const link = makeLink();
		const view = createLinkResultModalView(link);
		expect(view.callback_id).toBe('create_link_result');
		expect(view.close.text).toBe('Done');
		expect(view).not.toHaveProperty('submit');
	});

	it('should include short URL and destination', () => {
		const link = makeLink();
		const view = createLinkResultModalView(link);
		const text = view.blocks[0].text.text;
		expect(text).toContain(link.url);
		expect(text).toContain(link.destinationUrl);
		expect(text).toContain(link.qrUrl);
	});

	it('should show namespace as none when null', () => {
		const link = makeLink({ namespace: null });
		const view = createLinkResultModalView(link);
		const text = view.blocks[0].text.text;
		expect(text).toContain('*Namespace:* none');
	});

	it('should show namespace when present', () => {
		const link = makeLink({ namespace: 'my-brand' });
		const view = createLinkResultModalView(link);
		const text = view.blocks[0].text.text;
		expect(text).toContain('*Namespace:* my-brand');
	});

	it('should show password protected when true', () => {
		const link = makeLink({ passwordProtected: true });
		const view = createLinkResultModalView(link);
		const text = view.blocks[0].text.text;
		expect(text).toContain('*Password protected:* yes');
	});

	it('should not show password protected when false', () => {
		const link = makeLink({ passwordProtected: false });
		const view = createLinkResultModalView(link);
		const text = view.blocks[0].text.text;
		expect(text).not.toContain('Password protected');
	});

	it('should show scheduled at when present', () => {
		const link = makeLink({ scheduledAt: '2025-06-01T12:00:00.000Z' });
		const view = createLinkResultModalView(link);
		const text = view.blocks[0].text.text;
		expect(text).toContain('*Scheduled at:* 2025-06-01T12:00:00.000Z');
	});
});

describe('lookUpLinkResultModalView', () => {
	it('should show full link details', () => {
		const link = makeLink();
		const view = lookUpLinkResultModalView(link);
		expect(view.callback_id).toBe('look_up_link_result');
		const text = view.blocks[0].text.text;
		expect(text).toContain(`*ID:* ${link.id}`);
		expect(text).toContain(link.url);
		expect(text).toContain(link.destinationUrl);
		expect(text).toContain(link.createdAt);
		expect(text).toContain(link.updatedAt);
	});

	it('should show expires as never when null', () => {
		const link = makeLink({ expiresAt: null });
		const view = lookUpLinkResultModalView(link);
		const text = view.blocks[0].text.text;
		expect(text).toContain('*Expires:* never');
	});

	it('should show expires date when present', () => {
		const link = makeLink({ expiresAt: '2025-12-31T00:00:00.000Z' });
		const view = lookUpLinkResultModalView(link);
		const text = view.blocks[0].text.text;
		expect(text).toContain('*Expires:* 2025-12-31T00:00:00.000Z');
	});
});
