import { describe, expect, it } from 'vitest';
import { generateShortId } from '../../src/utils/generate-short-id';
import { defaultShortPathLength } from '../../src/utils/constants';

describe('generateShortId', () => {
	const characters = '23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

	it('should generate an ID of the correct length', () => {
		const length = 10;
		const id = generateShortId(length);
		expect(id).toHaveLength(length);
	});

	it('should only use specified characters', () => {
		const length = 15;
		const id = generateShortId(length);
		for (let char of id) {
			expect(characters).toContain(char);
		}
	});

	it('should generate of default length when not given a specified length', () => {
		const id = generateShortId();
		expect(id.length).toBe(defaultShortPathLength);
	});

	it('should generate unique IDs on subsequent calls', () => {
		const length = 8;
		const id1 = generateShortId(length);
		const id2 = generateShortId(length);
		expect(id1).not.toEqual(id2);
	});

	// Additional test: Check randomness over multiple iterations
	it('should have a reasonable distribution of characters', () => {
		const length = 5;
		const iterations = 1000;
		const counts = new Map();

		for (let i = 0; i < iterations; i++) {
			const id = generateShortId(length);
			for (let char of id) {
				counts.set(char, (counts.get(char) || 0) + 1);
			}
		}

		for (let char of characters) {
			expect(counts.get(char)).toBeGreaterThan(0);
		}
	});
});
