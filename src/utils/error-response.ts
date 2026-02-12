import { ZodError, ZodIssue } from 'zod';

type FieldError = {
	field: string;
	code: string;
	message: string;
	params?: Record<string, unknown>;
};

type ErrorResponse = {
	error: {
		message: string;
		errors?: FieldError[];
	};
};

export const errorResponse = (message: string): ErrorResponse => ({
	error: { message },
});

export const validationErrorResponse = (errors: FieldError[]): ErrorResponse => ({
	error: {
		message: errors[0]?.message ?? 'Validation failed',
		errors,
	},
});

const mapZodIssue = (issue: ZodIssue): FieldError => {
	const field = issue.path.join('.');

	switch (issue.code) {
		case 'too_small': {
			const isString = issue.type === 'string';
			return {
				field,
				code: isString ? 'too_short' : 'too_low',
				message: issue.message,
				params: { minimum: issue.minimum as number },
			};
		}
		case 'too_big': {
			const isString = issue.type === 'string';
			return {
				field,
				code: isString ? 'too_long' : 'too_high',
				message: issue.message,
				params: { maximum: issue.maximum as number },
			};
		}
		case 'invalid_string':
			return {
				field,
				code: 'invalid_format',
				message: issue.message,
				params: { expected: issue.validation as string },
			};
		case 'invalid_type':
			return {
				field,
				code: 'invalid_type',
				message: issue.message,
				params: { expected: issue.expected },
			};
		case 'invalid_enum_value':
			return {
				field,
				code: 'invalid_value',
				message: issue.message,
				params: { expected: issue.options },
			};
		default:
			return {
				field,
				code: 'invalid',
				message: issue.message,
			};
	}
};

export const zodToErrorResponse = (error: ZodError): ErrorResponse => {
	const errors = error.issues.map(mapZodIssue);
	return validationErrorResponse(errors);
};
