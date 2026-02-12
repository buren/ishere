import { extractShortPath } from './extract-short-path';

export type SlackCommand = {
	command: 'help' | 'stats' | 'get' | 'details' | 'create' | 'update' | 'invalid';
	id?: string;
	destinationUrl?: string;
	namespace?: string;
	shortPath?: string;
};

export const SLACK_COMMAND_USAGE_MRKDWN =
	'*Usage instructions*\n- `/ishere stats {id}`\n- `/ishere get {id}`\n- `/ishere details {id}`\n- `/ishere create {url}`\n- `/ishere create {namespace} {url}`\n- `/ishere create {namespace} {shortPath} {url}`\n- `/ishere update {id} {url}`';

/**
 * Parses a Slack command string and returns a structured object representing the command.
 *
 * The supported Slack commands are:
 *
 * **Help**
 *  - `/ishere`
 *  - `/ishere help`
 *
 * **Stats**
 *  - `/ishere stats {id}`
 *
 * **Get**
 *  - `/ishere get {id}`
 *
 * **Details**
 *  - `/ishere details {id}`
 *
 * **Create**
 *  - `/ishere create {url}`
 *  - `/ishere create {namespace} {url}`
 *  - `/ishere create {namespace} {shortPath} {url}`
 *
 * **Update**
 *  - `/ishere update {id} {url}`
 *
 * @param {string} text - The raw text input from the Slack command.
 * @returns {SlackCommand} An object representing the parsed command, or an object with command: 'invalid' if the command is not recognized.
 */
export const parseSlackCommand = (text: string): SlackCommand => {
	const parts = text.trim().split(/\s+/); // Split by whitespace

	if (parts.length === 0 || parts[0] === 'help' || parts[0] === '') {
		return { command: 'help', };
	}

	if (parts[0] === 'stats' && parts.length >= 2) {
		return {
			command: 'stats',
			id: extractShortPath(parts[1]),
		};
	}

	if (parts[0] === 'get' && parts.length >= 2) {
		return {
			command: 'get',
			id: extractShortPath(parts[1]),
		};
	}

	if (parts[0] === 'details' && parts.length >= 2) {
		return {
			command: 'details',
			id: extractShortPath(parts[1]),
		};
	}

	if (parts[0] === 'update' && parts.length >= 3) {
		return {
			command: 'update',
			id: extractShortPath(parts[1]),
			destinationUrl: parts[2],
		};
	}

	if (parts[0] === 'create') {
		if (parts.length === 2) {
			return {
				command: 'create',
				destinationUrl: parts[1],
			};
		} else if (parts.length === 3) {
			return {
				command: 'create',
				namespace: parts[1],
				destinationUrl: parts[2],
			};
		} else if (parts.length === 4) {
			return {
				command: 'create',
				namespace: parts[1],
				shortPath: parts[2],
				destinationUrl: parts[3],
			};
		}
	}

	return { command: 'invalid', };
};
