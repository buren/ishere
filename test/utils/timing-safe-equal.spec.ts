import { describe, it, expect } from 'vitest';
import timingSafeEqual from '../../src/utils/timing-safe-equal';

describe('timingSafeEqual', () => {
	it('should return true for equal strings', async () => {
		expect(await timingSafeEqual('hello', 'hello')).toBe(true);
	});

	it('should return false for unequal strings of same length', async () => {
		expect(await timingSafeEqual('hello', 'world')).toBe(false);
	});

	it('should return false for strings of different lengths', async () => {
		expect(await timingSafeEqual('short', 'much longer string')).toBe(false);
	});

	it('should return true for empty strings', async () => {
		expect(await timingSafeEqual('', '')).toBe(true);
	});

	it('should return false when only one string is empty', async () => {
		expect(await timingSafeEqual('', 'notempty')).toBe(false);
	});
});
