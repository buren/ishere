import { describe, expect, it } from 'vitest';
import { extractShortPath } from '../../src/utils/extract-short-path';

describe('extractShortPath', () => {
	it('should extract short path from URLs', () => {
		// With protocol
		expect(extractShortPath('https://dev.wshr.io/xyz')).toBe('xyz');
		expect(extractShortPath('https://dev.wshr.io/name-xyz')).toBe('name-xyz');
		expect(extractShortPath('https://dev.wshr.io/name/xyz')).toBe('name-xyz');
		expect(extractShortPath('http://localhost:8776/xyz')).toBe('xyz');
		expect(extractShortPath('https://dev.wshr.io/name-xyz')).toBe('name-xyz');
		expect(extractShortPath('http://localhost:8776/name/xyz')).toBe('name-xyz');
		expect(extractShortPath('     http://localhost:8776/name/xyz     ')).toBe('name-xyz');
		// No protocol
		expect(extractShortPath('dev.wshr.io/xyz')).toBe('xyz');
		expect(extractShortPath('dev.wshr.io/name-xyz')).toBe('name-xyz');
		expect(extractShortPath('dev.wshr.io/name/xyz')).toBe('name-xyz');
		expect(extractShortPath('dev.wshr.io/name-xyz')).toBe('name-xyz');
		expect(extractShortPath('     dev.wshr.io/name/xyz     ')).toBe('name-xyz');
	});

	it('should handle inputs that are already short paths', () => {
		expect(extractShortPath('xyz')).toBe('xyz');
		expect(extractShortPath('name-xyz')).toBe('name-xyz');
		expect(extractShortPath('name-xyz-abc')).toBe('name-xyz-abc');
		expect(extractShortPath('name/xyz')).toBe('name-xyz');
		expect(extractShortPath('/name/xyz')).toBe('name-xyz');
		expect(extractShortPath('/name-abc/xyz-abc')).toBe('name-abc-xyz-abc');
		expect(extractShortPath('/name_abc/xyz_abc-xyz')).toBe('name_abc-xyz_abc-xyz');
	});

	it('should handle edge cases', () => {
		expect(extractShortPath('http://localhost:8776/')).toBe('');
		expect(extractShortPath('invalid-url')).toBe('invalid-url');
		expect(extractShortPath('   https://example.com/abc   ')).toBe('abc');
	});
});
