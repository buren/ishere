import { describe, expect, it } from 'vitest';
import { isValidPathPattern } from '../../src/utils/is-valid-path-pattern';

describe('isValidPathPattern', () => {
	it('should return true for valid alphanumeric strings', () => {
		expect(isValidPathPattern('abc123')).toBeTruthy();
		expect(isValidPathPattern('ABC123')).toBeTruthy();
		expect(isValidPathPattern('a')).toBeTruthy();
	});

	it('should return true for valid strings with underscores or -', () => {
		expect(isValidPathPattern('abc_123')).toBeTruthy();
		expect(isValidPathPattern('abc-123')).toBeTruthy();
	});

	it('should return false for strings with spaces', () => {
		expect(isValidPathPattern('abc 123')).toBeFalsy();
	});

	it('should return false for strings with special characters', () => {
		expect(isValidPathPattern('abc@123')).toBeFalsy();
		expect(isValidPathPattern('abc.123')).toBeFalsy();
		expect(isValidPathPattern('"abc"')).toBeFalsy();
		expect(isValidPathPattern("'abc'")).toBeFalsy();
		expect(isValidPathPattern('ab.c')).toBeFalsy();
		expect(isValidPathPattern('ab*c')).toBeFalsy();
		expect(isValidPathPattern('ab/c')).toBeFalsy();
		expect(isValidPathPattern('ab\\c')).toBeFalsy();
		expect(isValidPathPattern('ab;c')).toBeFalsy();
		expect(isValidPathPattern('ab:c')).toBeFalsy();
		expect(isValidPathPattern('ab(c')).toBeFalsy();
		expect(isValidPathPattern('ab)c')).toBeFalsy();
	});

	it('should return false for namesapaces that start/end with - or _', () => {
		expect(isValidPathPattern('-abc')).toBeFalsy();
		expect(isValidPathPattern('_abc')).toBeFalsy();
		expect(isValidPathPattern('-abc-')).toBeFalsy();
		expect(isValidPathPattern('_abc_')).toBeFalsy();
		expect(isValidPathPattern('abc-')).toBeFalsy();
		expect(isValidPathPattern('abc_')).toBeFalsy();
	});

	it('should return false for empty strings', () => {
		expect(isValidPathPattern('')).toBeFalsy();
	});
});
