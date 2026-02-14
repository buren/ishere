import { isbot } from "isbot";

type MaybeString = string | undefined;

// NOTE: The order of the blobs and doubles must match the order when writing to
// the Cloudflare Analytics Engine table.
export const redirectsTable = {
	id: 'index1',
	userAgent: 'blob1',
	colo: 'blob2',
	country: 'blob3',
	region: 'blob4',
	city: 'blob5',
	metroCode: 'blob6',
	timezone: 'blob7',
	isBot: 'blob8',
	latitude: 'double1',
	longitude: 'double2',
	timestamp: 'timestamp',
} as const;

const parseCoordinate = (coord: string | undefined): number =>
	coord ? parseFloat(coord) : 0;

const trackLinkRedirect = async (id: string, { cf: cfProps, headers }: Request, env: Env) => {
	const cf = cfProps || {};
	const userAgent = headers.get('user-agent') || 'unknown';

	try {
		env.REDIRECTS.writeDataPoint({
			// NOTE the below is order dependent and needs to match analyticsTableMap
			blobs: [
				userAgent,
				(cf?.colo as MaybeString) || null,
				(cf?.country as MaybeString) || null,
				(cf?.region as MaybeString) || null,
				(cf?.city as MaybeString) || null,
				(cf?.metroCode as MaybeString) || null,
				(cf?.timezone as MaybeString) || null,
				isbot(userAgent) ? 'true' : 'false',
			],
			doubles: [
				parseCoordinate(cf?.latitude as MaybeString),
				parseCoordinate(cf?.longitude as MaybeString),
			],
			indexes: [id],
		});
	} catch {
		// Analytics write failures are non-critical — silently ignore
	}
};

export default trackLinkRedirect;
