import { ActionHttpStatus } from '../types';

export default class StatusError extends Error {
	status: ActionHttpStatus;
	message: string;
	path: string | null;

	constructor(status: ActionHttpStatus, message: string, path: string | null = null) {
		super(message);

		this.status = status;
		this.message = message;
		this.path = path;
	}
}
