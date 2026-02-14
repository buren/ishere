import { LinkAnalyticsGroupByOption } from '../types';

export const messages = {
	notFound: 'Not found.',
	serviceUnavailable: `Service unavailable.`,
	internalServerError: 'Internal server error.',
	invalidExpirationTtl: 'Minimum value is 60.',
	idIsReserved: 'Provided shortPath, namespace or shortPath/namespace combination is reserved.',
	idIsInUse: 'Provided shortPath/namespace combination is already in use.',
	deleteRequestReceived: 'Delete request received. Can take up to a minute to propagate.',
	deleted: 'Link deleted successfully.',
	scheduledAtInPast: 'Scheduled date must be in the future.',
};

export const durationInSeconds: Record<LinkAnalyticsGroupByOption, number> = { day: 86400, hour: 3600 };
