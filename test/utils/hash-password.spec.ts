import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/utils/hash-password';

describe('hashPassword', () => {
	it('should return a 64-character hex string', async () => {
		const hash = await hashPassword('test');
		expect(hash).toMatch(/^[0-9a-f]{64}$/);
	});

	it('should return consistent hash for the same input', async () => {
		const hash1 = await hashPassword('password123');
		const hash2 = await hashPassword('password123');
		expect(hash1).toBe(hash2);
	});

	it('should return different hashes for different inputs', async () => {
		const hash1 = await hashPassword('password1');
		const hash2 = await hashPassword('password2');
		expect(hash1).not.toBe(hash2);
	});
});

describe('verifyPassword', () => {
	it('should return true for correct password', async () => {
		const hash = await hashPassword('secret');
		expect(await verifyPassword('secret', hash)).toBe(true);
	});

	it('should return false for incorrect password', async () => {
		const hash = await hashPassword('secret');
		expect(await verifyPassword('wrong', hash)).toBe(false);
	});

	it('should return false for empty password against valid hash', async () => {
		const hash = await hashPassword('secret');
		expect(await verifyPassword('', hash)).toBe(false);
	});
});
