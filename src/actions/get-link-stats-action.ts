import StatusError from '../errors/status-error';
import { linkRedirectsAnalytics } from '../analytics/link-redirects-analytics';
import { Action, LinkAnalyticsGroupByOption } from '../types';
import { isValidPathPattern } from '../utils/is-valid-path-pattern';
import { messages, durationInSeconds } from './constants';
import { getLinkWithD1Fallback } from '../utils/get-link-with-d1-fallback';

export const getLinkStatsAction: Action = async ({ data, env, ctx }) => {
	const { id, groupBy } = data;

	if (isValidPathPattern(id) === false) {
		throw new StatusError(400, 'Invalid id');
	}

	const value = await getLinkWithD1Fallback(env, id, ctx);
	if (value === null) {
		throw new StatusError(404, messages.notFound);
	}

	try {
		const groupBySeconds = durationInSeconds[groupBy as LinkAnalyticsGroupByOption];
		const analytics = await linkRedirectsAnalytics(env, { id, groupBySeconds });
		return {
			status: 200,
			data: analytics,
		};
	} catch(error) {
		throw new StatusError(500, messages.internalServerError);
	}
};
