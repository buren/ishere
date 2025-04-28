import StatusError from '../errors/status-error';
import { linkRedirectsAnalytics } from '../analytics/link-redirects-analytics';
import { Action, LinkAnalyticsGroupByOption } from '../types';
import { isValidPathPattern } from '../utils/is-valid-path-pattern';
import { messages, durationInSeconds } from './constants';

export const isValidTimeGroup = (groupBy: string) => !!durationInSeconds[groupBy as LinkAnalyticsGroupByOption];

export const getLinkStatsAction: Action = async ({ data, env }) => {
	const { id, groupBy } = data;

	const value = await env.KV.get(id, { type: 'json' });
	if (value === null) {
		throw new StatusError(404, messages.notFound);
	}

	if (isValidPathPattern(id) === false) {
		throw new StatusError(400, 'Invalid id');
	}

	if (!isValidTimeGroup(groupBy)) {
		throw new StatusError(400, 'Invalid groupBy, must be one of: day, hour');
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
