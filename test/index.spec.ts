import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import { homePageHtml } from '../src/html';

describe('IsHere worker', () => {
	it('responds with home page', async () => {
		const response = await SELF.fetch('https://example.com');
		expect(await response.text()).toMatch(homePageHtml());
	});

	it('responds API docs page', async () => {
		const response = await SELF.fetch('https://example.com/docs');
		expect(await response.text()).toMatch('Scalar.createApiReference');
	});
});
