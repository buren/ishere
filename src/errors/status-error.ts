type ActionHttpStatus = 200 | 400 | 401 | 403 | 404 | 500 | 503;

export default class StatusError extends Error {
	status: ActionHttpStatus;
	message: string;
	path: string | null;
	code: string | null;

	constructor(status: ActionHttpStatus, message: string, path: string | null = null, code: string | null = null) {
		super(message);

		this.status = status;
		this.message = message;
		this.path = path;
		this.code = code;
	}
}
