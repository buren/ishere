import { customAlphabet } from "nanoid";
import { defaultShortPathLength } from "./constants";

// exclude characters that look similar
const alphabet = '23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

export const generateShortId = (length: number = defaultShortPathLength) => {
	const nanoid = customAlphabet(alphabet, length);
	return nanoid();
};
