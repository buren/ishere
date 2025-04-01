import StatusError from '../errors/status-error';
import { notFoundResponseData } from '../openapi';

const statusErrorToJson = (error: StatusError) => ({
	status: error.status,
	data:
		error.status === 404
			? notFoundResponseData()
			: {
					success: false,
					error: {
						issues: [
							{
								validation: 'validation',
								code: `${error.status}`,
								message: error.message,
								path: error.path ? [error.path] : [],
							},
						],
						name: 'ValidationError',
					},
			  },
});

export default statusErrorToJson;
