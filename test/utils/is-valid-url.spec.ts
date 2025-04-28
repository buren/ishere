import { describe, expect, it } from 'vitest';
import { isValidUrl } from '../../src/utils/is-valid-url';

describe('isValidUrl', () => {
	it('should return true for a valid http URL', () => {
		expect(isValidUrl('http://www.example.com')).toBeTruthy();
	});

	it('should return true for a valid https URL', () => {
		expect(isValidUrl('https://www.example.com')).toBeTruthy();
	});

	it('should return false for an invalid URL', () => {
		expect(isValidUrl('www.example.com')).toBeFalsy();
	});

	it('should return false for a non-URL string', () => {
		expect(isValidUrl('just a string')).toBeFalsy();
	});

	it('should return false for a URL with unsupported protocol', () => {
		expect(isValidUrl('ftp://www.example.com')).toBeFalsy();
	});
});
