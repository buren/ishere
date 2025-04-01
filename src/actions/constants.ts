import { GroupBy } from '../types';
import { legacyApiKeyHeader, maximumNamespaceLength, maximumShortPathLength, minimumShortPathLength } from '../utils/constants';

// TODO see which of these messages aren't used anymore
export const messages = {
	notFound: 'Not found.',
	serviceUnavailable: `Service unavailable.`,
	invalidApiTokenHeader: `Invalid API token for header ${legacyApiKeyHeader}.`,
	internalServerError: 'Internal server error.',
	invalidJsonBody: 'Invalid JSON body.',
	invalidNamespace: `Only [a-zA-Z0-9_-] is allowed for namespace and shorter than ${maximumNamespaceLength}.`,
	invalidMinLength: `length must be ${minimumShortPathLength} or greater`,
	invalidMaxLength: `length must be ${maximumShortPathLength} or less`,
	invalidShortPath: 'Only [a-zA-Z0-9_-] is allowed for shortPath.',
	invalidExpirationTtl: 'Minimum value is 60.',
	invalidDestinationUrl: 'Invalid destinationUrl, must be a valid URL including http:// or https://.',
	idIsReserved: 'Provided shortPath/namespace combination is reserved.',
	idIsInUse: 'Provided shortPath/namespace combination is already in use.',
	deleteRequestReceived: 'Delete request received. Can take a few minutes to propagate.',
};

export const durationInSeconds: Record<GroupBy, number> = { day: 86400, hour: 3600 };
