import StatusError from '../errors/status-error';
import { errorResponse, validationErrorResponse } from './error-response';

const statusErrorToJson = (error: StatusError) => ({
	status: error.status,
	data:
		error.status === 404
			? errorResponse('Not found')
			: error.path
				? validationErrorResponse([
						{
							field: error.path,
							code: error.code ?? 'invalid',
							message: error.message,
						},
				  ])
				: errorResponse(error.message),
});

export default statusErrorToJson;
