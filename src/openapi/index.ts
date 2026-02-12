import { z } from 'zod';
import { errorResponseSchemaWithExample, ValidationErrorResponseSchema } from '../schema';
import { errorResponse } from '../utils/error-response';

export const jsonResponseDoc = (status: number, schema: z.ZodType, description: string) => ({
	[status]: {
		content: { 'application/json': { schema } },
		description,
	},
})

// Doc helpers
export const serverErrorResponseDoc = () => ({
	500: {
		content: { 'application/json': { schema: errorResponseSchemaWithExample('Internal server error') } },
		description: 'Internal server error',
	},
	503: {
		content: { 'application/json': { schema: errorResponseSchemaWithExample('Service unavailable') } },
		description: 'Service Unavailable',
	},
});

export const standardResponsesDoc = (
	{ auth = true, validations = false }: { auth?: boolean; validations?: boolean } = { auth: true, validations: false }
) => ({
	...(validations
		? {
				400: { content: { 'application/json': { schema: ValidationErrorResponseSchema } }, description: 'Validation error.' },
		  }
		: {}),
	404: { content: { 'application/json': { schema: errorResponseSchemaWithExample('Not found') } }, description: 'Not found' },
	...serverErrorResponseDoc(),
	...(auth
		? {
				401: {
					content: { 'application/json': { schema: errorResponseSchemaWithExample('Invalid authorization. Use Authorization: Bearer <token>') } },
					description: 'Authorization error',
				},
				403: {
					content: { 'application/json': { schema: errorResponseSchemaWithExample('Invalid API key. Use Authorization: Bearer <token>') } },
					description: 'Authentication error',
				},
		  }
		: {}),
});

export const buildRequestDoc = ({
	schema,
	params,
}: {
	schema?: z.ZodType;
	params?: z.AnyZodObject;
}) => ({
	...(schema ? { body: { content: { 'application/json': { schema } } } } : {}),
	...(params ? { params } : {}),
});

export const buildSlackRequestDoc = ({ schema }: { schema: z.ZodType }) => ({
	// TODO what content type is there form formData?
	body: { content: { 'application/x-www-form-urlencoded': { schema } } },
	query: z.object({
		apiKey: z.string().describe('Pass API key as query param: `apiKey=yourapikey`.'),
	}),
});

// Response data
export const internalServerErrorResponseData = () => errorResponse('Internal server error');

export const serviceUnavailableErrorResponseData = () => errorResponse('Service unavailable');

export const notFoundResponseData = () => errorResponse('Not found');
