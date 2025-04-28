type MaybeString = string | undefined;
type MaybeNumber = number | undefined;

const trackLinkRedirect = async (id: string, { cf, headers }: Request, env: Env) => {
	const dataset = env.ENVIRONMENT === 'development' ? env.REDIRECTS_DEV : env.REDIRECTS;
	console.log(`Writing analytics data point (${env.ENVIRONMENT})`);

	dataset.writeDataPoint({
		// NOTE the below is order dependent
		blobs: [
			id,
			headers.get('user-agent'),
			// TODO we need to double check that c.req.cf exists in Hono
			(cf?.colo as MaybeString) || null,
			(cf?.country as MaybeString) || null,
			(cf?.region as MaybeString) || null,
			(cf?.city as MaybeString) || null,
			(cf?.metroCode as MaybeString) || null,
			(cf?.timezone as MaybeString) || null,
		],
		doubles: [(cf?.latitude as MaybeNumber) || 0, (cf?.longitude as MaybeNumber) || 0],
		indexes: [id],
	});
};

export default trackLinkRedirect;
