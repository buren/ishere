import timingSafeEqual from './timing-safe-equal';

export const hashPassword = async (password: string): Promise<string> => {
	const encoded = new TextEncoder().encode(password);
	const hash = await crypto.subtle.digest('SHA-256', encoded);
	return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
	const inputHash = await hashPassword(password);
	return timingSafeEqual(inputHash, hash);
};
