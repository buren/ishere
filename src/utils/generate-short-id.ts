import { customAlphabet } from "nanoid";

// exclude characters that look similar
const alphabet = '23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

export const generateShortId = (length: number) => {
	const nanoid = customAlphabet(alphabet, length);
	return nanoid();
};
