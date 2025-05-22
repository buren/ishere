import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import { homePageHtml } from '../src/html';

describe('IsHere worker', () => {
	it('responds with Hello World! (integration style)', async () => {
		const response = await SELF.fetch('https://example.com');
		expect(await response.text()).toMatch(homePageHtml());
	});
});
