import { isValidUrl } from './is-valid-url';

const trimSlashes = (str: string) => str.replace(/^\/+|\/+$/g, '');

export const extractShortPath = (input: string): string => {
	const normalizedInput = input.trim();

	// Check if it looks like a URL but is missing protocol
	const looksLikeUrl = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(normalizedInput);
	const inputWithProtocol = looksLikeUrl ? `https://${normalizedInput}` : normalizedInput;

	if (isValidUrl(inputWithProtocol)) {
		const pathname = new URL(inputWithProtocol).pathname;
		const pathParts = trimSlashes(pathname).split('/');
		return pathParts.join('-');
	} else {
		const parts = trimSlashes(normalizedInput).split(/[-/]/); // Split by either - or /
		return parts.join('-');
	}
};
